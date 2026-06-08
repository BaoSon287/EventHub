/**
 * Mock Database for EventHub
 * Simulates a full-scale REST backend database in LocalStorage.
 * Keeps data synchronized across pages and sessions if the backend is offline.
 */

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'organizer' | 'attendee';
  name: string;
  avatar: string;
  phone?: string;
  organization?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'music' | 'tech' | 'art' | 'food' | 'sport';
  image: string;
  date: string;
  time: string;
  location: string;
  price: number;
  capacity: number;
  booked: number;
  organizerId: string;
  organizerName: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  featured?: boolean;
}

export interface Booking {
  id: string;
  eventId: string;
  eventTitle: string;
  eventImage: string;
  eventDate: string;
  eventLocation: string;
  userId: string;
  userEmail: string;
  userName: string;
  quantity: number;
  totalPrice: number;
  ticketType: 'standard' | 'vip';
  status: 'pending_payment' | 'paid' | 'cancelled';
  bookingDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  createdAt: string;
}

const DEFAULT_USERS: User[] = [
  {
    id: 'user-1',
    username: 'user',
    email: 'user@eventhub.vn',
    role: 'attendee',
    name: 'Nguyễn Văn A',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    phone: '0901234567'
  },
  {
    id: 'user-2',
    username: 'organizer',
    email: 'organizer@eventhub.vn',
    role: 'organizer',
    name: 'Trần Thị B (EventPro)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    phone: '0987654321',
    organization: 'EventPro Agency'
  },
  {
    id: 'user-3',
    username: 'admin',
    email: 'admin@eventhub.vn',
    role: 'admin',
    name: 'Quản trị viên Hệ thống',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    phone: '0912345678'
  }
];

const DEFAULT_EVENTS: Event[] = [
  {
    id: 'event-1',
    title: 'Đại Nhạc Hội Ravolution Music Festival 2026',
    description: 'Sự kiện âm nhạc EDM hoành tráng nhất trong năm với dàn DJ quốc tế hàng đầu thế giới, hệ thống ánh sáng 3D mapping cực đỉnh.',
    content: 'Hãy chuẩn bị sẵn sàng cho đêm nhạc EDM bùng nổ nhất năm 2026! Ravolution Music Festival quay trở lại với quy mô chưa từng có.\n\nTham dự sự kiện, bạn sẽ được hòa mình vào không gian âm thanh đỉnh cao từ hệ chức âm thanh L-Acoustics hàng đầu thế giới, dàn Lineup DJ thuộc danh sách Top 100 DJ Mag, cùng hiệu ứng thị giác đỉnh cao được dàn dựng bởi các chuyên gia quốc tế.',
    category: 'music',
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1000',
    date: '2026-07-25',
    time: '16:00 - 23:30',
    location: 'Sân vận động Quân khu 7, TP. Hồ Chí Minh',
    price: 450000,
    capacity: 20000,
    booked: 15420,
    organizerId: 'user-2',
    organizerName: 'EventPro Agency',
    status: 'upcoming',
    featured: true
  },
  {
    id: 'event-2',
    title: 'Hội Thảo Công Nghệ Việt Nam Tech Summit 2026',
    description: 'Diễn đàn công nghệ tiên phong quy tụ hơn 50 chuyên gia hàng đầu về Artificial Intelligence, Web3 và Cloud Computing.',
    content: 'Việt Nam Tech Summit 2026 là không gian kết nối cộng đồng công nghệ, chia sẻ các xu hướng cốt lõi định hình tương lai.\n\nChủ đề năm nay xoay quanh:\n- Ứng dụng thực tiễn của Generative AI trong doanh nghiệp\n- Bảo mật dữ liệu và kỷ nguyên Web3\n- Điện toán đám mây và Microservices mở rộng.\n\nĐăng ký ngay để giữ chỗ và có cơ hội networking với các CTO, Founder hàng đầu thị trường.',
    category: 'tech',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000',
    date: '2026-06-30',
    time: '08:00 - 17:30',
    location: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
    price: 300000,
    capacity: 500,
    booked: 412,
    organizerId: 'user-2',
    organizerName: 'EventPro Agency',
    status: 'upcoming',
    featured: true
  },
  {
    id: 'event-3',
    title: 'Triển lãm Nghệ thuật Đương đại "Sắc Màu Thời Gian"',
    description: 'Nơi trưng bày hơn 100 tác phẩm hội họa, điêu khắc và nghệ thuật sắp đặt độc đáo của các nghệ sĩ trẻ tiềm năng tại Việt Nam.',
    content: 'Lấy cảm hứng từ sự luân chuyển không ngừng của nhịp sống hiện đại, "Sắc Màu Thời Gian" mang đến góc nhìn đa chiều về quá khứ, hiện tại và tương lai thông qua lăng kính hội họa.\n\nKhách tham quan sẽ có cơ hội trải nghiệm không gian nghệ thuật sắp đặt ánh sáng (light installation) tương tác trực tiếp vô cùng ấn tượng.',
    category: 'art',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=1000',
    date: '2026-08-10',
    time: '09:00 - 21:00',
    location: 'The Factory Contemporary Arts Centre, Quận 2, TP. HCM',
    price: 120000,
    capacity: 200,
    booked: 85,
    organizerId: 'user-1',
    organizerName: 'Nguyễn Văn A',
    status: 'upcoming',
    featured: false
  },
  {
    id: 'event-4',
    title: 'Lễ Hội Ẩm Thực Đường Phố Sài Gòn Street Food 2026',
    description: 'Cơ hội trải nghiệm hơn 200 món ăn đường phố đặc sắc từ khắp các vùng miền Việt Nam và các nước Đông Nam Á lân cận.',
    content: 'Điểm hẹn hoàn hảo cho các tín đồ ẩm thực đam mê khám phá văn hóa ẩm thực bình dị mà tuyệt diệu.\n\nSự kiện quy tụ các đầu bếp nổi tiếng, các gian hàng gia truyền trứ danh cùng chương trình biểu diễn nhạc acoustic sôi động mỗi đêm.',
    category: 'food',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1000',
    date: '2026-06-20',
    time: '15:00 - 23:00',
    location: 'Công viên 23/9, Quận 1, TP. Hồ Chí Minh',
    price: 50000,
    capacity: 10000,
    booked: 8900,
    organizerId: 'user-2',
    organizerName: 'EventPro Agency',
    status: 'upcoming',
    featured: true
  },
  {
    id: 'event-5',
    title: 'Giải Chạy Marathon Quốc Tế "Run For Green" 2026',
    description: 'Giải chạy marathon cộng đồng vì môi trường xanh với 3 cự ly thi đấu: 5km, 10km, và 21km tại cung đường ven sông đẹp tuyệt vời.',
    content: 'Mỗi bước chạy của bạn sẽ đóng góp trực tiếp 1 cây xanh vào quỹ trồng rừng phòng hộ đầu nguồn.\n\nHãy cùng bạn bè và gia đình rèn luyện sức khỏe, hòa mình vào thiên nhiên và lan tỏa thông điệp bảo vệ Trái Đất xanh! Toàn bộ vận động viên hoàn thành cự ly đều nhận được kỷ niệm chương đúc thủ công ý nghĩa.',
    category: 'sport',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1000',
    date: '2026-09-05',
    time: '04:30 - 10:00',
    location: 'Khu đô thị Sala, TP. Thủ Đức, TP. HCM',
    price: 350000,
    capacity: 5000,
    booked: 3210,
    organizerId: 'user-3',
    organizerName: 'Quản trị viên Hệ thống',
    status: 'upcoming',
    featured: false
  }
];

const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 'book-1',
    eventId: 'event-2',
    eventTitle: 'Hội Thảo Công Nghệ Việt Nam Tech Summit 2026',
    eventImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000',
    eventDate: '2026-06-30',
    eventLocation: 'Trung tâm Hội nghị Quốc gia, Hà Nội',
    userId: 'user-1',
    userEmail: 'user@eventhub.vn',
    userName: 'Nguyễn Văn A',
    quantity: 2,
    totalPrice: 600000,
    ticketType: 'standard',
    status: 'paid',
    bookingDate: '2026-06-05T09:12:00Z'
  },
  {
    id: 'book-2',
    eventId: 'event-1',
    eventTitle: 'Đại Nhạc Hội Ravolution Music Festival 2026',
    eventImage: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=1000',
    eventDate: '2026-07-25',
    eventLocation: 'Sân vận động Quân khu 7, TP. Hồ Chí Minh',
    userId: 'user-1',
    userEmail: 'user@eventhub.vn',
    userName: 'Nguyễn Văn A',
    quantity: 1,
    totalPrice: 450000,
    ticketType: 'vip',
    status: 'pending_payment',
    bookingDate: '2026-06-07T10:00:00Z'
  }
];

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    title: 'Đăng ký vé thành công',
    message: 'Vé của bạn cho sự kiện "Hội Thảo Công Nghệ Việt Nam Tech Summit 2026" đã được thanh toán và xác nhận thành công!',
    type: 'success',
    read: false,
    createdAt: '2026-06-05T09:15:00Z'
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    title: 'Nhắc nhở thanh toán',
    message: 'Yêu cầu đặt vé cho sự kiện "Ravolution Music Festival 2026" đang chờ thanh toán. Vui lòng hoàn tất thanh toán để nhận vé.',
    type: 'warning',
    read: false,
    createdAt: '2026-06-07T10:01:00Z'
  },
  {
    id: 'notif-3',
    userId: 'user-2',
    title: 'Sự kiện mới được tạo thành công',
    message: 'Bạn đã đăng ký tổ chức thành công sự kiện "Lễ Hội Ẩm Thực Đường Phố Sài Gòn". Sự kiện hiện đang công khai để nhận đăng ký.',
    type: 'info',
    read: true,
    createdAt: '2026-06-01T14:30:00Z'
  }
];

// Helper to initialize and retrieve database
export class MockDatabase {
  static init() {
    if (!localStorage.getItem('eventhub_users')) {
      localStorage.setItem('eventhub_users', JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem('eventhub_events')) {
      localStorage.setItem('eventhub_events', JSON.stringify(DEFAULT_EVENTS));
    }
    if (!localStorage.getItem('eventhub_bookings')) {
      localStorage.setItem('eventhub_bookings', JSON.stringify(DEFAULT_BOOKINGS));
    }
    if (!localStorage.getItem('eventhub_notifications')) {
      localStorage.setItem('eventhub_notifications', JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
  }

  // --- Users ---
  static getUsers(): User[] {
    this.init();
    return JSON.parse(localStorage.getItem('eventhub_users') || '[]');
  }

  static getUserByUsername(username: string): User | undefined {
    return this.getUsers().find(u => u.username === username);
  }

  static addUser(user: User) {
    const users = this.getUsers();
    users.push(user);
    localStorage.setItem('eventhub_users', JSON.stringify(users));
  }

  static updateUser(id: string, updatedFields: Partial<User>): User | undefined {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedFields };
      localStorage.setItem('eventhub_users', JSON.stringify(users));
      return users[index];
    }
    return undefined;
  }

  // --- Events ---
  static getEvents(): Event[] {
    this.init();
    return JSON.parse(localStorage.getItem('eventhub_events') || '[]');
  }

  static getEventById(id: string): Event | undefined {
    return this.getEvents().find(e => e.id === id);
  }

  static createEvent(event: Omit<Event, 'id' | 'booked'>): Event {
    const events = this.getEvents();
    const newEvent: Event = {
      ...event,
      id: `event-${Date.now()}`,
      booked: 0
    };
    events.push(newEvent);
    localStorage.setItem('eventhub_events', JSON.stringify(events));
    return newEvent;
  }

  static updateEvent(id: string, updatedFields: Partial<Event>): Event | undefined {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
      events[index] = { ...events[index], ...updatedFields };
      localStorage.setItem('eventhub_events', JSON.stringify(events));
      return events[index];
    }
    return undefined;
  }

  static deleteEvent(id: string): boolean {
    const events = this.getEvents();
    const filtered = events.filter(e => e.id !== id);
    if (filtered.length !== events.length) {
      localStorage.setItem('eventhub_events', JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  // --- Bookings ---
  static getBookings(): Booking[] {
    this.init();
    return JSON.parse(localStorage.getItem('eventhub_bookings') || '[]');
  }

  static getBookingById(id: string): Booking | undefined {
    return this.getBookings().find(b => b.id === id);
  }

  static createBooking(booking: Omit<Booking, 'id' | 'bookingDate' | 'status'> & { status?: Booking['status'] }): Booking {
    const bookings = this.getBookings();
    const newBooking: Booking = {
      ...booking,
      id: `book-${Date.now()}`,
      status: booking.status || 'pending_payment',
      bookingDate: new Date().toISOString()
    };
    bookings.push(newBooking);
    localStorage.setItem('eventhub_bookings', JSON.stringify(bookings));

    // Update event slot counter
    const event = this.getEventById(booking.eventId);
    if (event) {
      this.updateEvent(booking.eventId, { booked: event.booked + booking.quantity });
    }

    // Add automatic notice
    this.createNotification({
      userId: booking.userId,
      title: 'Đăng ký giữ vé thành công',
      message: `Bạn vừa đặt thành công ${booking.quantity} vé [${booking.ticketType.toUpperCase()}] cho sự kiện "${booking.eventTitle}". Vui lòng thanh toán số tiền ${booking.totalPrice.toLocaleString('vi-VN')}đ để hoàn tất!`,
      type: 'warning'
    });

    return newBooking;
  }

  static updateBookingStatus(id: string, status: Booking['status']): Booking | undefined {
    const bookings = this.getBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index].status = status;
      localStorage.setItem('eventhub_bookings', JSON.stringify(bookings));

      // Trigger user notice
      if (status === 'paid') {
        this.createNotification({
          userId: bookings[index].userId,
          title: 'Thanh toán thành công',
          message: `Thanh toán thành công số tiền ${bookings[index].totalPrice.toLocaleString('vi-VN')}đ cho vé "${bookings[index].eventTitle}". Hãy mang mã code vé đến check-in!`,
          type: 'success'
        });
      }

      return bookings[index];
    }
    return undefined;
  }

  // --- Notifications ---
  static getNotifications(): Notification[] {
    this.init();
    return JSON.parse(localStorage.getItem('eventhub_notifications') || '[]');
  }

  static createNotification(notif: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification {
    const notifications = this.getNotifications();
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    notifications.unshift(newNotif);
    localStorage.setItem('eventhub_notifications', JSON.stringify(notifications));
    return newNotif;
  }

  static markNotificationRead(id: string): boolean {
    const notifications = this.getNotifications();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      localStorage.setItem('eventhub_notifications', JSON.stringify(notifications));
      return true;
    }
    return false;
  }

  static markAllNotificationsRead(userId: string): boolean {
    const notifications = this.getNotifications();
    notifications.forEach(n => {
      if (n.userId === userId) n.read = true;
    });
    localStorage.setItem('eventhub_notifications', JSON.stringify(notifications));
    return true;
  }
}
