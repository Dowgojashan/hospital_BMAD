import React from 'react';

const HospitalLogo = ({ size = 40, showText = true }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: size / 2, fontWeight: 'bold', color: 'inherit' }}>
      <div style={{ width: size, height: size, backgroundColor: '#007bff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: size / 2, fontWeight: 'bold' }}>
        H
      </div>
      {showText && <span style={{ marginLeft: size / 4 }}>智慧醫療</span>}
    </div>
  );
};

export default HospitalLogo;