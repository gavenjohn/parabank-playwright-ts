export type Customer = {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  ssn: string;
  username: string;
  password: string;
};

// Every test gets its own customer. Uniqueness comes from a timestamp plus a
// random suffix - timestamp alone collides when two tests start in the same
// millisecond, which is exactly what happens under parallel execution.
export function newCustomer(): Customer {
  const unique = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900) + 100}`;
  return {
    firstName: 'Test',
    lastName: 'Customer',
    street: '123 Avenue',
    city: 'Montreal',
    state: 'Quebec',
    zipCode: 'H4A3L5',
    phoneNumber: '1234567890',
    ssn: '987654321',
    username: `u_${unique}`,
    password: 'Test1234',
  };
}