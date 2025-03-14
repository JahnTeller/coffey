export type ClerkUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string;
};

export type StaffInfo = {
  created_at: string;
  userId: string;
  role: string;
  staffName: string;
};

// export type User = {
//   clerkUser: ClerkUser;
//   staffInfo: StaffInfo;
// };
export type User = {
  clerkUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    imageUrl: string;
  };
  staffInfo: {
    created_at: string;
    userId: string;
    role: string;
    staffName: string;
  };
};

export type Order = {
  id: number;
  created_at: string;
  order_detail: {
    id: number;
    note: string;
    quantity: number;
    drink: {
      id: number;
      name: string;
      price: number;
    };
    drink_id: number;
    order_id: number;
  }[];
  staff_id: string;
  status: string;
  table_number: number;
};
