// src/pages/Home.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import DesignList from "../components/DesignList";

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


  const handleCustomize = () => {
    nav( '/customize' );
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
                BẮT ĐẦU<br className="xl:block hidden" /> NGAY.
              </h1>
            </motion.div>

            <motion.div {...headContentAnimation} className="flex flex-col gap-5">
              <p className="max-w-md font-normal text-gray-600 text-base">
                Tạo chiếc áo độc bản của riêng bạn với công cụ tùy biến 3D hoàn toàn mới.{' '}
                <strong>Thỏa sức tưởng tượng</strong> và khẳng định phong cách của riêng bạn.
              </p>

              <CustomButton
                type="filled"
                title="Thiết kế ngay"
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
