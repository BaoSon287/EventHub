import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Sparkles, Users, UserCog, CalendarDays, KeyRound, TicketCheck } from 'lucide-react';
import { authApi } from '../api/authApi';
import { MockDatabase, User } from '../api/mockDb';
import { Sidebar } from '../components/Sidebar';
import { DashboardCard } from '../components/DashboardCard';
import { StatusBadge } from '../components/StatusBadge';
import { Button } from '../components/Button';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(() => authApi.getCurrentUser());
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAllUsers = () => {
    setLoading(true);
    // Fetch users list from simulation db
    const list = MockDatabase.getUsers();
    setUsers(list);
    setLoading(false);
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login?message=Chào bạn, khu vực Admin yêu cầu tài quyền Administrator tối cao.');
      return;
    }
    fetchAllUsers();
  }, [currentUser, navigate]);

  const handleRoleShift = (username: string, newRole: User['role']) => {
    const list = MockDatabase.getUsers();
    const idx = list.findIndex(u => u.username === username);
    if (idx !== -1) {
      list[idx].role = newRole;
      localStorage.setItem('eventhub_users', JSON.stringify(list));
      fetchAllUsers();
      
      // If current user modified themselves
      if (currentUser?.username === username) {
        const updatedUser = { ...currentUser, role: newRole };
        localStorage.setItem('eventhub_current_user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        window.dispatchEvent(new Event('storage'));
      }
    }
  };

  const handleUserDelete = (username: string) => {
    if (username === 'admin') {
      alert('Không thể xóa Quản trị viên gốc.');
      return;
    }
    if (!window.confirm(`Xóa tài khoản "${username}" khỏi hệ thống?`)) return;

    const list = MockDatabase.getUsers();
    const filtered = list.filter(u => u.username !== username);
    localStorage.setItem('eventhub_users', JSON.stringify(filtered));
    fetchAllUsers();
  };

  // Compute platform general status summary
  const totalAccounts = users.length;
  const organizerCount = users.filter(u => u.role === 'organizer').length;
  const attendeesCount = users.filter(u => u.role === 'attendee').length;

  return (
    <div className="flex bg-slate-50 min-h-screen">
      
      {/* Structural Admin sub-menu Sidebar */}
      <Sidebar />

      {/* Main core content */}
      <main className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto max-w-7xl">
        
        {/* Page Head header */}
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6.5 h-6.5 text-indigo-600 shrink-0" />
            Cổng quản trị Hệ thống Admin
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Trang điều khiển phân quyền tài khoản, giám sát hoạt động thành viên trên EventHub.</p>
        </div>

        {/* 3 general dashboard metrics cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <DashboardCard
            title="Thành viên"
            value={`${totalAccounts} Tài khoản`}
            icon={<Users className="w-5 h-5" />}
            change="+4.5%"
            changeType="positive"
          />
          <DashboardCard
            title="Nhà tổ chức hoạt động"
            value={`${organizerCount} Đối tác`}
            icon={<UserCog className="w-5 h-5" />}
            change="+1.2%"
            changeType="positive"
          />
          <DashboardCard
            title="Người mua vé tích cực"
            value={`${attendeesCount} Thành viên`}
            icon={<TicketCheck className="w-5 h-5" />}
            change="+6.8%"
            changeType="positive"
          />
        </div>

        {/* Members Management tables */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Danh sách tài khoản quản trị viên sở hữu</h3>
            <span className="text-[10px] font-bold text-slate-400">Hiển thị {users.length} tài khoản</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 bg-slate-50">
                  <th className="py-3 px-6">Thành viên / Username</th>
                  <th className="py-3 px-6">Địa chỉ Email</th>
                  <th className="py-3 px-6">Phân quyền gốc (Role)</th>
                  <th className="py-3 px-6 text-right">Điều khiển tài khoản</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-semibold">
                {users.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    
                    <td className="py-3.5 px-6 flex items-center gap-3">
                      <img src={item.avatar} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      <div>
                        <p className="font-extrabold text-slate-800">{item.name}</p>
                        <p className="text-[10px] font-mono text-indigo-600 uppercase">@{item.username}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-6 font-semibold text-slate-500">
                      {item.email}
                    </td>

                    <td className="py-3.5 px-6">
                      <StatusBadge status={item.role} />
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        {/* Shifting role options */}
                        {item.role === 'attendee' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRoleShift(item.username, 'organizer')}
                            className="text-[10px] font-bold px-2 py-1! hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer"
                          >
                            Lên Organizer
                          </Button>
                        ) : item.role === 'organizer' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRoleShift(item.username, 'attendee')}
                            className="text-[10px] font-bold px-2 py-1! hover:bg-slate-200 cursor-pointer"
                          >
                            Xuống Attendee
                          </Button>
                        ) : null}

                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={item.username === 'admin'}
                          onClick={() => handleUserDelete(item.username)}
                          className="text-[10px] text-red-500 hover:bg-red-50/50 font-bold px-2 py-1! cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Xóa
                        </Button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </main>

    </div>
  );
};
