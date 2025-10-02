import FaucetForm from '@/components/FaucetForm'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 overflow-x-hidden">
      <div className="w-full">
        <FaucetForm />
      </div>
    </div>
  );
}
