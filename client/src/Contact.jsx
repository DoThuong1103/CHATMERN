import Avatar from "./Avatar";

const Contact = ({
  id,
  username,
  onClick,
  selected,
  online,
  setNewMessageText,
}) => {
  return (
    <div
      className={
        "flex gap-2 items-center border-b border-gray-100 cursor-pointer " +
        (selected ? "bg-blue-200 " : "")
      }
      onClick={() => {
        onClick(id);
        setNewMessageText();
      }}
    >
      {selected && <div className="w-1 h-12 bg-blue-500"></div>}
      <div className="flex gap-2 py-2 pl-4 items-center ">
        <Avatar userId={id} username={username} online={online} />
        <span> {username}</span>
      </div>
    </div>
  );
};

export default Contact;
