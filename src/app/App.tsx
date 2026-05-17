import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { ChatProvider } from '../context/ChatContext';

export default function App() {
  return (
    <ChatProvider>
      <RouterProvider router={router} />
      <Toaster />
    </ChatProvider>
  );
}
