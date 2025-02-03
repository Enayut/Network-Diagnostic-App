import { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

interface RequestBody {
  url: string;
}

interface FormattedResults {
  ping: { time: string; value: number }[];
  route: string[];
  status: string;
  latency: string;
  packetLoss: string;
  netstat: string[];
  ipconfig: string;
  ipAddress: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.setHeader('Allow', ['POST']).status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { url }: RequestBody = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Run network commands in parallel
    const [pingResults, traceResults, netstatResults, ipconfigResults, nslookupResults] = await Promise.all([
      runCommand(`ping ${url}`),
      runCommand(`tracert ${url}`),
      runCommand('netstat -n'),
      runCommand('ipconfig'),
      runCommand(`nslookup ${url}`)
    ]);

    const formattedResults: FormattedResults = {
      ping: formatPingData(pingResults),
      route: formatTraceData(traceResults),
      status: 'Connected',
      latency: calculateLatency(pingResults),
      packetLoss: calculatePacketLoss(pingResults),
      netstat: formatNetstatData(netstatResults),
      ipconfig: ipconfigResults || 'N/A',
      ipAddress: extractIpAddress(nslookupResults)
    };

    return res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Diagnostic error:', error);
    return res.status(500).json({ error: 'Failed to run diagnostics' });
  }
}

// Run shell commands safely
async function runCommand(command: string): Promise<string> {
  try {
    const { stdout } = await execAsync(command);
    return stdout || '';
  } catch (error) {
    console.error(`Error running ${command}:`, error);
    return '';
  }
}

// Format ping output
function formatPingData(pingOutput: string): { time: string; value: number }[] {
  return pingOutput.split('\n')
    .filter(line => line.includes('time='))
    .map((line, index) => {
      const match = line.match(/time=(\d+(\.\d+)?)/);
      return { time: `${index + 1}ms`, value: match ? parseFloat(match[1]) : 0 };
    });
}

// Format traceroute output
function formatTraceData(traceOutput: string): string[] {
  return traceOutput.split('\n')
    .filter(line => /^\s*\d+/.test(line))
    .map(line => line.trim());
}

// Calculate latency (average response time)
function calculateLatency(pingOutput: string): string {
  const times = pingOutput.split('\n')
    .filter(line => line.includes('time='))
    .map(line => {
      const match = line.match(/time=(\d+(\.\d+)?)/);
      return match ? parseFloat(match[1]) : 0;
    });

  if (times.length === 0) return 'N/A';
  return `${Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)}ms`;
}

// Calculate packet loss percentage
function calculatePacketLoss(pingOutput: string): string {
  const match = pingOutput.match(/(\d+)% packet loss/);
  return match ? `${match[1]}%` : '0%';
}

// Format netstat output
function formatNetstatData(netstatOutput: string): string[] {
  return netstatOutput.split('\n')
    .filter(line => /^tcp/.test(line))
    .map(line => line.trim())
    .slice(0, 5);
}

// Extract IP address from nslookup output
function extractIpAddress(nslookupOutput: string): string {
  const match = nslookupOutput.match(/Address:\s*([^\s]+)/);
  return match ? match[1] : 'N/A';
}
