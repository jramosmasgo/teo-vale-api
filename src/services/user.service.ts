import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { IUser } from '../interfaces';
import { generateToken } from '../utils/jwt.handle';

export class UserService {
  async createUser(userData: IUser): Promise<IUser> {
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    
    const user = new User(userData);
    return await user.save();
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser | null> {
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const user = await User.findByIdAndUpdate(id, userData, { new: true });
    return user;
  }

  async loginUser({ email, password }: any) {
    const checkIs = await User.findOne({ email });
    if (!checkIs) return "NOT_FOUND_USER";

    const passwordHash = checkIs.password || "";
    const isCorrect = await bcrypt.compare(password, passwordHash);

    if (!isCorrect) return "PASSWORD_INCORRECT";

    const token = generateToken(checkIs.id);
    const data = {
      token,
      user: checkIs,
    };
    return data;
  }
}
