// src/pages/MyDesigns.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import DesignList from '../components/DesignList';
import { CustomButton } from '../components';

const MyDesigns = () => {
  const { user } = useAuth();
  const nav = useNavigate();

  return (
    <section className="page-wrap">
      <div className="ui-layer px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Mẫu thiết kế đã lưu</h1>
          <CustomButton
            type="filled"
            title="Thiết kế mới"
            handleClick={() => nav('/customize')}
            customStyles="w-fit px-4 py-2.5 font-bold text-sm"
          />
        </div>

        <DesignList userId={user?.id} />
      </div>
    </section>
  );
};

export default MyDesigns;
