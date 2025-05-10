// server/routes.ts içine eklenecek
import { clientPortalRouter } from './routes/client-portal';

// registerRoutes içinde app.use ile eklenecek
app.use('/api/client-portal', clientPortalRouter);
