import SendIcon from "@mui/icons-material/Send";
import { getNativeSelectUtilityClasses } from "@mui/material";
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import LogoutIcon from "@mui/icons-material/Logout";
import Logo from "./Logo";
import { uniqBy } from "lodash";
import { UserContext } from "./UserContext";
import axios from "axios";
import dayjs from "dayjs";
import Contact from "./Contact";

const Chat = () => {
  const [ws, setWs] = useState(getNativeSelectUtilityClasses);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const divUnderMessage = useRef(null);
  const { setId, id, setUsername, username } = useContext(UserContext);
  useEffect(() => {
    connectedToWs();
  }, [selectedUserId]);
  const connectedToWs = () => {
    const ws = new WebSocket("ws://localhost:4040/");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        connectedToWs();
      }, 1000);
    });
  };

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);
    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else if ("text" in messageData) {
      if (messageData.sender === selectedUserId) {
        setMessages((prev) => [...prev, { ...messageData }]);
      }
    }
  }

  const sendMessage = (ev, file = null) => {
    if (ev) ev.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
        file,
      })
    );
    setNewMessageText("");
    setMessages((prev) => [
      ...prev,
      {
        text: newMessageText,
        isOur: true,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      },
    ]);
    if (file) {
      axios.get("messages/" + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    } else {
      setNewMessageText("");
      setMessages((prev) => [
        ...prev,
        {
          text: newMessageText,
          isOur: true,
          sender: id,
          recipient: selectedUserId,
          _id: Date.now(),
        },
      ]);
    }
  };

  const sendFile = (ev) => {
    const reader = new FileReader();
    reader.readAsDataURL(ev?.target?.files[0]);
    reader.onload = () => {
      sendMessage(null, {
        name: ev.target.files[0].name,
        data: reader.result,
      });
    };
  };

  const logout = () => {
    axios.post("/logout").then((res) => {
      setUsername(null);
      setId(null);
      setWs(null);
    });
  };

  useEffect(() => {
    axios.get("people").then((res) => {
      const offlinePeopleArr = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach((p) => {
        offlinePeople[p._id] = p.username;
      });
      const isOnlinePeopleEmpty = Object.keys(onlinePeople).length === 0;
      if (!isOnlinePeopleEmpty) {
        setOfflinePeople(offlinePeople);
      }
    });
  }, [onlinePeople]);

  const onlinePeopleExclOurUser = { ...onlinePeople };
  delete onlinePeopleExclOurUser[id];
  const messagesWithoutDupes = uniqBy(messages, "_id");

  useEffect(() => {
    if (selectedUserId) {
      axios.get("messages/" + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  const shouldDisplayStartTime = (currentIndex) => {
    if (currentIndex === 0) {
      return true;
    }

    const prevMessage = messages[currentIndex - 1];
    const currentMessage = messages[currentIndex];

    const prevTime = dayjs(prevMessage.updatedAt);
    const currentTime = dayjs(currentMessage.updatedAt);

    return currentTime.diff(prevTime, "minute") >= 30;
  };

  // Hàm kiểm tra xem có phải là ảnh không
  function isImageFile(filePath) {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".svg"];
    const extension = filePath
      .substring(filePath.lastIndexOf("."))
      .toLowerCase();
    return imageExtensions.includes(extension);
  }

  // useLayoutEffect(() => {
  //   const div = divUnderMessage.current;
  //   if (div) {
  //     div.scrollIntoView({ behavior: "smooth", block: "end" });
  //   }
  // }, [messages]);

  useEffect(() => {
    const messageContainer = document.getElementById("messageContainer");
    if (messages && messageContainer) {
      setTimeout(() => {
        messageContainer.scrollTo({
          top: messageContainer.scrollHeight,
          behavior: "smooth",
          block: "end",
        });
      }, 0);
    }
  }, [messages]);

  return (
    <div className="flex h-screen">
      <div className="flex flex-col justify-between w-1/5 min-w-[240px] ">
        <div>
          <Logo></Logo>
          {Object.keys(onlinePeopleExclOurUser).map((userId) => (
            <Contact
              key={userId}
              id={userId}
              username={onlinePeopleExclOurUser[userId]}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId}
              online={true}
              setNewMessageText={() => setNewMessageText("")}
            />
          ))}
          {Object.keys(offlinePeople).map((userId) => (
            <Contact
              key={userId}
              id={userId}
              username={offlinePeople[userId]}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId}
              online={false}
              setNewMessageText={() => setNewMessageText("")}
            />
          ))}
        </div>
        <div className="flex justify-between gap-4 items-center py-2 px-4">
          <div className="flex items-center gap-1 text-gray-500 ">
            <AccountCircleIcon />
            <span className="text-lg">{username}</span>
          </div>

          <div
            onClick={logout}
            className="flex gap-2 px-2 py-1 bg-blue-300 text-gray-500 rounded-sm cursor-pointer hover:bg-blue-400 hover:text-white transition-all ease-in-out duration-600"
          >
            <LogoutIcon></LogoutIcon>
            <span>logout</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-blue-200 flex-1 pl-2 ">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex flex-col justify-center items-center h-full text-2xl text-gray-300 ">
              &larr; Select a person from the sidebar
            </div>
          )}
          {selectedUserId && (
            <div className="relative h-full ">
              <div
                id="messageContainer"
                className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2 pr-2"
              >
                {messagesWithoutDupes.map((message, index) => (
                  <div
                    key={index}
                    className={
                      "pt-2 max-w-[50%]  " +
                      (message.sender === id
                        ? "w-fit ml-auto "
                        : "w-fit mr-auto ")
                    }
                  >
                    {shouldDisplayStartTime(index) && (
                      <span className="text-gray-400 text-xs">
                        {dayjs(message.updatedAt).format("YYYY-MM-DD HH:mm")}
                      </span>
                    )}
                    {message.text && (
                      <div
                        className={
                          "p-2 my-2 rounded-sm text-sm  " +
                          (message.sender === id
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-500 ")
                        }
                      >
                        {message.text}
                      </div>
                    )}
                    {message.file &&
                      (isImageFile(message.file) ? (
                        <div className="max-w-60">
                          <img
                            src={
                              axios.defaults.baseURL +
                              "/uploads/" +
                              message.file
                            }
                            alt=""
                          />
                        </div>
                      ) : (
                        <div
                          className={
                            "p-2 my-2 rounded-sm text-sm " +
                            (message.sender === id
                              ? "bg-blue-500 text-white"
                              : "bg-white text-gray-500 ")
                          }
                        >
                          <a
                            href={
                              axios.defaults.baseURL +
                              "/uploads/" +
                              message.file
                            }
                          >
                            {message.file}
                          </a>
                        </div>
                      ))}
                  </div>
                ))}
                <div ref={divUnderMessage}></div>
              </div>
            </div>
          )}
        </div>
        {selectedUserId && (
          <form className="flex gap-2 pr-2 pb-3" onSubmit={sendMessage}>
            <input
              type="text"
              className="bg-white border p-1 px-2 rounded-lg flex-1"
              placeholder="type your message here "
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
            />
            <label className="bg-blue-400 p-2 text-white rounded-lg cursor-pointer">
              <input type="file" className="hidden" onChange={sendFile} />
              <AttachFileIcon />
            </label>
            <button
              type="submit"
              className="bg-blue-500 p-2 text-white rounded-lg cursor-pointer"
            >
              <SendIcon className="" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;
