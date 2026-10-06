import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  submitComplaint,
  uploadPhoto,
  getComplaints,
  getSingleComplaint,
  updateStatus,
  updatePriority,
  assignStaff,
  addRemark,
  getStatistics,
  getNotifications,
  markNotificationAsRead,
  getMaintenanceStaff,
} from '../controllers/fixitController.ts';
import { requireAuth } from '../middleware/authMiddleware.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../../public/uploads');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safeName = `fx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_MIME_TYPE: Only JPG, PNG, and WebP images are allowed.'));
    }
  },
});

const router = Router();

// Complaints
router.post('/complaints', requireAuth, submitComplaint);
router.post(
  '/complaints/upload',
  requireAuth,
  (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: { code: 'UPLOAD_ERROR', message: err.message },
        });
      }
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        req.file = req.files[0];
      }
      next();
    });
  },
  uploadPhoto
);
router.get('/complaints', requireAuth, getComplaints);
router.get('/complaints/:complaintId', requireAuth, getSingleComplaint);
router.patch('/complaints/:complaintId/status', requireAuth, updateStatus);
router.patch('/complaints/:complaintId/priority', requireAuth, updatePriority);
router.patch('/complaints/:complaintId/assign', requireAuth, assignStaff);
router.post('/complaints/:complaintId/remarks', requireAuth, addRemark);

// Statistics
router.get('/statistics', getStatistics);
router.get('/stats', getStatistics);

// Maintenance Staff
router.get('/staff', getMaintenanceStaff);

// Notifications
router.get('/notifications', requireAuth, getNotifications);
router.patch('/notifications/:id/read', requireAuth, markNotificationAsRead);

export default router;
