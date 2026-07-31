import AdminChatWidget from '../components/AdminChatWidget';

const Chat = () => {
  return (
    <div className="h-[calc(100vh-7rem)] sm:h-[calc(100vh-8rem)]">
      <div className="mb-3 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Chat</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Connect with other administrators in real-time</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-[calc(100%-4rem)] sm:h-[calc(100%-5rem)]">
        <AdminChatWidget />
      </div>
    </div>
  );
};

export default Chat;
