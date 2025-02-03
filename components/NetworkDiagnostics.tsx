'use client';
import React, { useState } from 'react';
import { Terminal } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Results {
    status: string;
    latency: string; // Changed to string
    packetLoss: number;
    route: string[];
    ping: { time: string; value: number }[];
    ipAddress: string;
}

const NetworkDiagnostics: React.FC = () => {
    const [url, setUrl] = useState<string>('');
    const [results, setResults] = useState<Results | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const runDiagnostics = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/network-diagnostics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error('Failed to run diagnostics');
            }

            const data: Results = await response.json();
            setResults(data);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unknown error occurred');
            }
        }
    };

    const getConnectionQuality = (latency: number) => {
        if (latency <= 20) {
            return { text: '🚀 Excellent', color: 'text-green-400', barColor: 'bg-green-400', width: '90%' };
        } else if (latency <= 50) {
            return { text: '✅ Good', color: 'text-yellow-400', barColor: 'bg-yellow-400', width: '70%' };
        } else if (latency <= 100) {
            return { text: '⚠️ Average', color: 'text-yellow-600', barColor: 'bg-yellow-600', width: '50%' };
        } else {
            return { text: '❌ Poor', color: 'text-red-400', barColor: 'bg-red-400', width: '30%' };
        }
    };

    const parseLatency = (latency: string): number => {
        const match = latency.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    };

    return (
        <div className="min-h-screen text-white p-8">
            {/* Landing Animation */}
            <div className="text-center mb-12 animate-fade-in">
                <h1 className="text-4xl font-bold mb-4 animate-pulse">
                    Network Diagnostic Tool
                </h1>
                <p className="text-gray-400 text-lg animate-slide-up">
                    Understand your network connection in simple terms
                </p>
            </div>

            {/* URL Input */}
            <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Enter URL or IP address..."
                        className="w-full p-4 bg-gray-800 rounded-lg border-2 border-blue-500 focus:outline-none focus:border-blue-400 animate-glow"
                    />
                    <button
                        onClick={runDiagnostics}
                        disabled={loading}
                        className="absolute right-2 top-2 px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-500 transition-colors"
                    >
                        {loading ? 'Running...' : 'Analyze'}
                    </button>
                </div>
                {error && (
                    <div className="mt-2 text-red-400">
                        Error: {error}
                    </div>
                )}
            </div>

            {results && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Terminal Output */}
                    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
                        <div className="flex items-center mb-4">
                            <Terminal className="mr-2" />
                            <h2 className="text-xl font-semibold">Technical Details</h2>
                        </div>
                        <div className="font-mono text-sm text-green-400">
                            <p>Status: {results.status}</p>
                            <p>Latency: {results.latency}</p>
                            <p>Packet Loss: {results.packetLoss}</p>
                            <p>IP Address: {results.ipAddress}</p>
                            <div className="mt-4">
                                <p>Route:</p>
                                {results.route.map((hop, index) => (
                                    <p key={index}>  {index + 1}. {hop}</p>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Summary */}
                    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
                        <h2 className="text-xl font-semibold mb-4">Connection Quality</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={results.ping}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#4ade80"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4">
                            {(() => {
                                const latencyNumber = parseLatency(results.latency);
                                const quality = getConnectionQuality(latencyNumber);
                                return (
                                    <>
                                        <div className="flex justify-between items-center mb-2">
                                            <span>Connection Speed</span>
                                            <span className={quality.color}>{quality.text}</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div className={`${quality.barColor} h-2 rounded-full`} style={{ width: quality.width }}></div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NetworkDiagnostics;