import React, { useEffect, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { profileService } from '../services/profileService';
import { useAppSelector } from '../redux/hooks';

interface HistoryItem {
  eventName: string;
  eventDate: string;
  yourScore: number;
}

export const ProfilePage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    profileService.getMyHistory().then(res => {
      setHistory(res.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto w-full p-4 sm:p-8">
        <h1 className="text-2xl font-bold mb-2">{user?.name}'s Profile</h1>
        <p className="text-muted-foreground mb-8">{user?.email}</p>
        <h2 className="text-xl font-semibold mb-4">My Event History</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : history.length === 0 ? (
          <p className="text-muted-foreground">No event history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border rounded-lg">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2 text-left">Event Name</th>
                  <th className="px-4 py-2 text-left">Event Date</th>
                  <th className="px-4 py-2 text-left">Your Score</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-2">{item.eventName}</td>
                    <td className="px-4 py-2">{new Date(item.eventDate).toLocaleString()}</td>
                    <td className="px-4 py-2 font-semibold">{item.yourScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}; 