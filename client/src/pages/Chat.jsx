import { useParams, useLocation } from 'react-router-dom';
import AdminChatWidget from '../components/AdminChatWidget';

const Chat = () => {
  const location = useLocation();
  
  // Determine initial tab based on URL path
  const initialTab = location.pathname.includes('/chat/channels') ? 'channels' : 'direct';
  
  return (
    <div className="h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)]">
      <div className="mb-3 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          {initialTab === 'channels' ? 'Channel Messages' : 'Direct Messages'}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          {initialTab === 'channels' 
            ? 'Communicate with teams and groups' 
            : 'Connect with other administrators one-on-one'}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-[calc(100%-4rem)] sm:h-[calc(100%-5rem)]">
        <AdminChatWidget initialTab={initialTab} />
      </div>
    </div>
  );
};

export default Chat;
