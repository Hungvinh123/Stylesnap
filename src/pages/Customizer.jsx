import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { useSnapshot } from 'valtio';
import { useNavigate } from 'react-router-dom';

import Stage from '../components/Stage';
import LogoControls from '../canvas/LogoControls';
import TextControls from '../canvas/TextControls';

import state from '../store';
import { reader } from '../config/helpers';
import { EditorTabs, FilterTabs, DecalTypes, texturesLogos } from '../config/constants';
import { fadeAnimation, slideAnimation } from '../config/motion';
import { ColorPicker, CustomButton, FilePicker, TextureLogoPicker, Tab } from '../components';

const Customizer = () => {
  const snap = useSnapshot(state);
  const { user } = useAuth();
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
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => { state.intro = false; }, []);

  const generateTabContent = () => {
    switch (activeEditorTab) {
      case 'colorpicker':      return <ColorPicker />;
      case 'filepicker':       return <FilePicker file={file} setFile={setFile} readFile={readFile} />;
      case 'logocontrols':     return <LogoControls />;
      case 'textcontrols':     return <TextControls />;
      case 'texturelogopicker':return <TextureLogoPicker texturesLogos={texturesLogos} handleTextureLogoClick={handleTextureLogoClick} />;
      default:                 return null;
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
      case 'downloadShirt': handleDownload(); break;
      default: break;
    }
    setActiveFilterTab((prev) => ({ ...prev, [tabName]: !prev[tabName] }));
  };

  const handleDownload = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      if (!state.userId && user?.id) state.userId = user.id;
      const designId = state.designId;
      const userId   = state.userId ?? user?.id;

      if (!designId) {
        alert('Chưa có designId — hãy "Save Design" trước khi thanh toán.');
        return;
      }

      const res = await fetch(`/api/payment/check?designId=${designId}&userId=${userId}`);
      if (!res.ok) {
        const msg = await res.text();
        alert(`Lỗi kiểm tra thanh toán: ${res.status} ${msg}`);
        return;
      }
      const data = await res.json();

      if (data.status === "success") {
        const link = document.createElement("a");
        link.href = `/api/download/test.pdf`;
        link.download = "design.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const pay = await fetch(`/api/payment/create?designId=${designId}&userId=${userId}`);
        if (!pay.ok) {
          const msg = await pay.text();
          alert(`Tạo thanh toán lỗi: ${pay.status} ${msg}`);
          return;
        }
        const { url, error } = await pay.json();
        if (!url) {
          alert(`Không nhận được URL VNPay.${error ? ' ' + error : ''}`);
          return;
        }
        window.location.assign(url);
      }
    } catch (error) {
      console.error(error);
      alert('Có lỗi xảy ra khi xử lý thanh toán. Xem console để biết chi tiết.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSave = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id ?? null,
          title: "My T-Shirt Design",
          stateJson: snap,
          thumbnailUrl: null
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        alert(`Save failed! ${res.status} ${msg}`);
        return;
      }
      const data = await res.json();
      if (data.success && (data.designId || data.id)) {
        const newId = data.designId ?? data.id;
        state.designId = newId;
        state.userId   = data.userId ?? user?.id ?? state.userId;
        alert("Design saved!");
      } else {
        alert("Save failed! (no designId returned)");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Save error — xem console.");
    } finally {
      setIsBusy(false);
    }
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
      <Stage />
      <AnimatePresence>
        <motion.div className="panel-left" {...slideAnimation('left')}>
          <div className="editortabs-container tabs">
            {EditorTabs.map((tab, idx) => (
              <Tab key={tab?.name || `editor-${idx}`} tab={tab} handleClick={() => setActiveEditorTab(tab.name)} />
            ))}
            {/* nội dung theo tab */}
            {generateTabContent()}
          </div>
        </motion.div>

        <motion.div className="save-button ui-layer" {...fadeAnimation}>
          <CustomButton
            type="filled"
            title={isBusy ? "Saving..." : "Save Design"}
            handleClick={handleSave}
            disabled={isBusy}
            customStyles="w-fit px-4 py-2.5 font-bold text-sm"
          />
        </motion.div>

        <motion.div className="go-back ui-layer" {...fadeAnimation}>
          <CustomButton
            type="filled"
            title="Go Back"
            handleClick={() => nav('/home')}
            customStyles="w-fit px-4 py-2.5 font-bold text-sm"
          />
        </motion.div>

        <motion.div className="filtertabs-container ui-layer" {...slideAnimation('up')}>
          {FilterTabs.map((tab, idx) => (
            <Tab
              key={tab?.name || `filter-${idx}`}
              tab={tab}
              isFilterTab
              isActiveTab={!!activeFilterTab[tab.name]}
              handleClick={() => handleActiveFilterTab(tab.name)}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default Customizer;
