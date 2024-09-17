import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import SignIn from './Pages/signIn/SignIn';
import Chat from './Pages/Chat/Chat';
import Inscription from './Pages/inscription/Inscription';
import Confirmation from './Pages/inscription/Confirmation';
import ForgotPassword1 from './Pages/signIn/ForgotPassword1';
import ForgotPassword2 from './Pages/signIn/ForgotPassword2';
import ForgotPassword3 from './Pages/signIn/ForgotPassword3';
import Error from './Pages/general/404Error';
import Blocked from './Pages/signIn/blocked';
import Error500 from './Pages/general/500Error';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/SignIn" element={<SignIn />} />
          <Route path="/Chat" element={<Chat />} />
          <Route path="/Confirmation" element={<Confirmation />} />
          <Route path="/Inscription" element={<Inscription />} />
          <Route path="/ForgotPassword" element={<ForgotPassword1 />} />
          <Route path="/CodeDeConfirmation" element={<ForgotPassword2 />} />
          <Route path="/resetPassword" element={<ForgotPassword3 />} />
          <Route path="/blocked" element={<Blocked />} />
          <Route path="/Error500" element={<Error500 />} />
          <Route path="*" element={<Error />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
