import { useContext } from "react";
import { UserContext } from "./UserContext";
import { RegisterandLoginForm } from "./RegisterandLoginForm";
import Chat from "./Chat";

export default function Routes() {
  const { username, id } = useContext(UserContext);
  if (username) return <Chat></Chat>;
  return <RegisterandLoginForm />;
}
