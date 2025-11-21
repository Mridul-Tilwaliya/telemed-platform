import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';

const router = Router();
const doctorController = new DoctorController();

router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctor);

export default router;

