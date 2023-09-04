import axios from "axios";
import { useContext, useState } from "react";
import { UserContext } from "./UserContext";

export const RegisterandLoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIslogin] = useState(false);
  const [error, setError] = useState("");

  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);
  async function handleSubmit(e) {
    e.preventDefault();
    const url = isLogin ? "login" : "register";
    await axios
      .post(url, { username, password })
      .then((res) => {
        const data = res?.data;
        if (isLogin) {
          setLoggedInUsername(username);
          setId(data.id);
        } else {
          setIslogin(!isLogin);
          setUsername("");
          setPassword("");
        }
      })
      .catch((err) => {
        setError(err?.response?.data?.message);
      });
  }
  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form className="w-64 mx-auto" action="" onSubmit={handleSubmit}>
        <input
          type="text"
          name=""
          id=""
          placeholder="username"
          className="block w-full rounded-sm p-1 mb-2 border"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          name=""
          id=""
          placeholder="password"
          className="block w-full rounded-sm p-1 mb-2 border"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-blue-500 text-white block w-full rounded-sm p-1">
          {isLogin ? "Login" : "Register"}
        </button>
        <h1>{error && error} </h1>
        <div className="text-center mt-2">
          {isLogin ? "Don't have account?" : "Already a member?"}
          <div className="underline" onClick={() => setIslogin(!isLogin)}>
            {isLogin ? " Register here!" : " Login here!"}
          </div>
        </div>
      </form>
    </div>
  );
};
