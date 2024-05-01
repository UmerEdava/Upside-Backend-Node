import express from 'express';
import v1Routes from './v1Routes';
const router = express.Router();


router.use('/v1', v1Routes);


export default router;