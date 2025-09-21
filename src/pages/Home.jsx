import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

import Stage from '../components/Stage';
import { CustomButton } from '../components';
import {
  headContainerAnimation,
  headContentAnimation,
  headTextAnimation,
  slideAnimation
} from '../config/motion';

const Home = () => {
  const nav = useNavigate();
  const { user } = useAuth();

  const handleCustomize = () => {
    nav(user ? '/customize' : '/login?next=/customize');
  };

  return (
    <section className="page-wrap">
      {/* Model 3D */}
      <Stage />

      {/* Hero copy + CTA */}
      <AnimatePresence mode="wait">
        <motion.section key="home-hero" className="home ui-layer" {...slideAnimation('left')}>
          <motion.header {...slideAnimation('down')}>
            <img src="/threejs.png" alt="logo" className="w-8 h-8 object-contain" />
          </motion.header>

          <motion.div className="home-content" {...headContainerAnimation}>
            <motion.div {...headTextAnimation}>
              <h1 className="head-text">
                LET&apos;S <br className="xl:block hidden" /> DO IT.
              </h1>
            </motion.div>

            <motion.div {...headContentAnimation} className="flex flex-col gap-5">
              <p className="max-w-md font-normal text-gray-600 text-base">
                Create your unique and exclusive shirt with our brand-new 3D customization tool.{' '}
                <strong>Unleash your imagination</strong> and define your own style.
              </p>

              <CustomButton
                type="filled"
                title="Customize It"
                handleClick={handleCustomize}
                customStyles="w-fit px-4 py-2.5 font-bold text-sm"
              />
            </motion.div>
          </motion.div>
        </motion.section>
      </AnimatePresence>
    </section>
  );
};

export default Home;
