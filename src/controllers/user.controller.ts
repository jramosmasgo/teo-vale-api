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
}
