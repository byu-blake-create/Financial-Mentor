// Script to generate bcrypt hashed passwords for seed data
import bcrypt from "bcrypt";

const users = [
  { email: "john.doe@example.com", password: "password123" },
  { email: "jane.smith@example.com", password: "password123" },
  { email: "alice.johnson@example.com", password: "password123" },
  { email: "bob.williams@example.com", password: "password123" },
];

console.log("Generating bcrypt hashes for seed data...\n");

for (const user of users) {
  const hash = await bcrypt.hash(user.password, 10);
  console.log(`Email: ${user.email}`);
  console.log(`Password: ${user.password}`);
  console.log(`Hash: ${hash}\n`);
}
