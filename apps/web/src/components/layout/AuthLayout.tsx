import { Outlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Wrapper for all auth pages (login, register, reset-password).
 * Adds smooth fade + slide transitions between auth routes.
 */
export default function AuthLayout() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.key}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
