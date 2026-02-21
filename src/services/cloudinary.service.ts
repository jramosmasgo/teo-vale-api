import { v2 as cloudinary } from 'cloudinary';

// Configuración de Cloudinary con validación
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Validar que las credenciales estén configuradas
if (!cloudName || !apiKey || !apiSecret) {
  console.error('⚠️  ERROR: Cloudinary credentials are missing!');
  console.error('Please check your .env file and ensure these variables are set:');
  console.error('- CLOUDINARY_CLOUD_NAME');
  console.error('- CLOUDINARY_API_KEY');
  console.error('- CLOUDINARY_API_SECRET');
  console.error('\nCurrent values:');
  console.error(`CLOUDINARY_CLOUD_NAME: ${cloudName || 'NOT SET'}`);
  console.error(`CLOUDINARY_API_KEY: ${apiKey || 'NOT SET'}`);
  console.error(`CLOUDINARY_API_SECRET: ${apiSecret ? '***SET***' : 'NOT SET'}`);
} else {
  console.log('✅ Cloudinary credentials loaded successfully');
}

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export class CloudinaryService {
  /**
   * Sube una imagen a Cloudinary
   * @param fileBuffer - Buffer del archivo
   * @param folder - Carpeta en Cloudinary (ej: 'users', 'clients')
   * @param publicId - ID público opcional para el archivo
   * @returns URL de la imagen subida
   */
  async uploadImage(
    fileBuffer: Buffer,
    folder: string,
    publicId?: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
        uploadOptions.overwrite = true;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result!.secure_url);
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Elimina una imagen de Cloudinary
   * @param publicId - ID público del archivo en Cloudinary
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Extrae el public_id de una URL de Cloudinary
   * @param imageUrl - URL completa de la imagen
   * @returns Public ID de la imagen
   */
  extractPublicId(imageUrl: string): string | null {
    try {
      const urlParts = imageUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      
      if (uploadIndex === -1) return null;
      
      // Obtener la parte después de 'upload' y versión
      const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
      
      // Remover la extensión del archivo
      const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
      
      return publicId;
    } catch (error) {
      console.error('Error extracting public_id:', error);
      return null;
    }
  }

  /**
   * Sube imagen de perfil de usuario
   */
  async uploadUserProfileImage(fileBuffer: Buffer, userId: string): Promise<string> {
    return this.uploadImage(fileBuffer, 'users', `user_${userId}`);
  }

  /**
   * Sube imagen de perfil de cliente
   */
  async uploadClientProfileImage(fileBuffer: Buffer, clientId: string): Promise<string> {
    return this.uploadImage(fileBuffer, 'clients', `client_${clientId}`);
  }

  /**
   * Elimina imagen de perfil de usuario
   */
  async deleteUserProfileImage(userId: string): Promise<void> {
    await this.deleteImage(`users/user_${userId}`);
  }

  /**
   * Elimina imagen de perfil de cliente
   */
  async deleteClientProfileImage(clientId: string): Promise<void> {
    await this.deleteImage(`clients/client_${clientId}`);
  }
}
