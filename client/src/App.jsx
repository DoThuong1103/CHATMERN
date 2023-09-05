import { UserContextProvider } from "./UserContext";
import axios from "axios";
import Routes from "./Routes";
function App() {
  axios.defaults.baseURL = "https://chatmern.vercel.app/";
  axios.defaults.withCredentials = true;
  // const { username } = useContext(UserContext);

  return (
    <UserContextProvider>
      <Routes />
    </UserContextProvider>
  );
}
export default App;
