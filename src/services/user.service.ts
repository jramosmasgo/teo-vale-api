import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { IUser } from '../interfaces';
import { generateToken } from '../utils/jwt.handle';
import { CloudinaryService } from './cloudinary.service';

const cloudinaryService = new CloudinaryService();

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
  async deleteUser(id: string): Promise<IUser | null> {
    const user = await User.findByIdAndDelete(id);
    return user;
  }

  async getAllUsers(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find({}).skip(skip).limit(limit),
      User.countDocuments({})
    ]);
    return { users, total };
  }

  async uploadProfileImage(userId: string, fileBuffer: Buffer): Promise<IUser | null> {
    try {
      // Subir imagen a Cloudinary
      const imageUrl = await cloudinaryService.uploadUserProfileImage(fileBuffer, userId);
      
      // Actualizar el usuario con la nueva URL de imagen
      const user = await User.findByIdAndUpdate(
        userId,
        { profileImageUrl: imageUrl },
        { new: true }
      );

      return user;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  }

  async deleteProfileImage(userId: string): Promise<IUser | null> {
    try {
      // Eliminar imagen de Cloudinary
      await cloudinaryService.deleteUserProfileImage(userId);
      
      // Actualizar el usuario removiendo la URL de imagen
      const user = await User.findByIdAndUpdate(
        userId,
        { $unset: { profileImageUrl: 1 } },
        { new: true }
      );
      
      return user;
    } catch (error) {
      console.error('Error deleting profile image:', error);
      throw error;
    }
  }
}
