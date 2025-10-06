import bcrypt from 'bcrypt';

export const passwordHash = async (password: string) => {
 const pwHash = await bcrypt.hash(password, 10);
 return pwHash
}