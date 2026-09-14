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

// Timestamp plus a random suffix: the timestamp alone collides when two tests
// start in the same millisecond. Usernames are 11 characters, inside
// ParaBank's 20-character limit (DEF-001).
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