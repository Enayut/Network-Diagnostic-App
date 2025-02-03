import NetworkDiagnostics from "@/components/NetworkDiagnostics";

export default function Home() {
  return (
    <div style={
      {
        backgroundImage: 'url(/background.jpg)', 
        backgroundSize: 'cover', 
        backgroundPosition: 'center', 
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
        margin: 0
      }
    }>
      <NetworkDiagnostics />
    </div>
  );
}