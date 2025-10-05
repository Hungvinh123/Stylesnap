import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSnapshot } from 'valtio';
import { useNavigate } from 'react-router-dom';

import Stage from '../components/Stage';
import LogoControls from '../canvas/LogoControls';
import TextControls from '../canvas/TextControls';

import state from '../store';
import { downloadCanvasToImage, reader } from '../config/helpers';
import { EditorTabs, FilterTabs, DecalTypes, texturesLogos } from '../config/constants';
import { fadeAnimation, slideAnimation } from '../config/motion';
import { ColorPicker, CustomButton, FilePicker, TextureLogoPicker, Tab } from '../components';

const Customizer = () => {
  const snap = useSnapshot(state);
  const nav = useNavigate();

  const [file, setFile] = useState('');
  const [activeEditorTab, setActiveEditorTab] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState({
    frontLogoShirt: true,
    backLogoShirt: true,
    frontTextShirt: true,
    backTextShirt: true,
    stylishShirt: false,
  });

  useEffect(() => { state.intro = false; }, []);

  const generateTabContent = () => {
    switch (activeEditorTab) {
      case 'colorpicker': return <ColorPicker />;
      case 'filepicker': return <FilePicker file={file} setFile={setFile} readFile={readFile} />;
      case 'logocontrols': return <LogoControls />;
      case 'textcontrols': return <TextControls />;
      case 'texturelogopicker':
        return <TextureLogoPicker texturesLogos={texturesLogos} handleTextureLogoClick={handleTextureLogoClick} />;
      default: return null;
    }
  };

  const handleTextureLogoClick = (textureLogo) => {
    if (textureLogo.type === 'texture') {
      state.fullDecal = textureLogo.image;
      ensureFilterOn('stylishShirt');
    } else if (textureLogo.type === 'frontLogo') {
      state.frontLogoDecal = textureLogo.image;
      ensureFilterOn('frontLogoShirt');
    } else if (textureLogo.type === 'backLogo') {
      state.backLogoDecal = textureLogo.image;
      ensureFilterOn('backLogoShirt');
    }
  };

  const mapTypeToFilterTab = (type) => {
    if (type === 'frontLogo') return 'frontLogoShirt';
    if (type === 'backLogo') return 'backLogoShirt';
    return 'stylishShirt'; // 'full'
  };

  const ensureFilterOn = (filterName) => {
    if (!activeFilterTab[filterName]) handleActiveFilterTab(filterName);
  };

  const handleDecals = (type, result) => {
    const decalType = DecalTypes[type];
    if (!decalType) return;
    state[decalType.stateProperty] = result;
    ensureFilterOn(mapTypeToFilterTab(type));
  };

  const handleActiveFilterTab = (tabName) => {
    switch (tabName) {
      case 'frontLogoShirt': state.isFrontLogoTexture = !activeFilterTab[tabName]; break;
      case 'backLogoShirt': state.isBackLogoTexture = !activeFilterTab[tabName]; break;
      case 'frontTextShirt': state.isFrontText = !activeFilterTab[tabName]; break;
      case 'backTextShirt': state.isBackText = !activeFilterTab[tabName]; break;
      case 'stylishShirt': state.isFullTexture = !activeFilterTab[tabName]; break;
      case 'downloadShirt': downloadCanvasToImage(); break;
      default: break;
    }
    setActiveFilterTab((prev) => ({ ...prev, [tabName]: !prev[tabName] }));
  };

  const readFile = (type) => {
    if (!file) return;
    reader(file).then((result) => {
      handleDecals(type, result);
      setActiveEditorTab('');
    });
  };

  return (
    <section className="page-wrap">
      {/* Model 3D */}
      <Stage />

      <AnimatePresence>
        {/* 🔧 Panel trái: panel hẹp, không phủ toàn màn & KHÔNG gắn ui-layer */}
        <motion.div className="panel-left" {...slideAnimation('left')}>
          <div className="editortabs-container tabs">
            {EditorTabs.map((tab) => (
              <Tab key={tab.name} tab={tab} handleClick={() => setActiveEditorTab(tab.name)} />
            ))}
            {generateTabContent()}
          </div>
        </motion.div>

        {/* Go Back – góc phải trên (giữ ui-layer để style chung, nhưng vẫn click được) */}
        <motion.div className="go-back ui-layer" {...fadeAnimation}>
          <CustomButton
            type="filled"
            title="Go Back"
            handleClick={() => nav('/home')}
            customStyles="w-fit px-4 py-2.5 font-bold text-sm"
          />
        </motion.div>


        {/* Nhóm icon vàng – giữa đáy màn hình */}
        <motion.div className="filtertabs-container ui-layer" {...slideAnimation('up')}>
          {FilterTabs.map((tab) => (
            <Tab
              key={tab.name}
              tab={tab}
              isFilterTab
              isActiveTab={!!activeFilterTab[tab.name]}
              handleClick={() => handleActiveFilterTab(tab.name)}
            />
          ))}
          {/* Checkout button cùng hàng */}
          <CustomButton
            type="filled"
            title="Thanh Toán"
            handleClick={() => nav('/checkout')}
            customStyles="w-fit px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white"
          />

        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default Customizer;
