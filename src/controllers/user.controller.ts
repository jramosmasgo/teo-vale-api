import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

const userService = new UserService();

export class UserController {
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.updateUser(id as string, req.body);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error: any) {
      next(error);
    }
  }


  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.deleteUser(id as string);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const users = await userService.getAllUsers(Number(page) || 1, Number(limit) || 50);
      res.json(users);
    } catch (e) {
      next(e);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const responseUser = await userService.loginUser(req.body);

      if (responseUser === "PASSWORD_INCORRECT" || responseUser === "NOT_FOUND_USER") {
        res.status(403).send(responseUser);
      } else {
        res.send(responseUser);
      }
    } catch (e) {
      next(e);
    }
  }

  async uploadProfileImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ message: 'No se proporcionó ninguna imagen' });
      }

      const user = await userService.uploadProfileImage(id as string, req.file.buffer);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json({ message: 'Imagen de perfil actualizada exitosamente', user });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteProfileImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.deleteProfileImage(id as string);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json({ message: 'Imagen de perfil eliminada exitosamente', user });
    } catch (error: any) {
      next(error);
    }
  }
}
