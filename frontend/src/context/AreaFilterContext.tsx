import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface AreaFilterContextType {
  selectedDistrictId: string;
  setSelectedDistrictId: (id: string) => void;
  selectedMahallaId: string;
  setSelectedMahallaId: (id: string) => void;
  clearFilters: () => void;
}

const AreaFilterContext = createContext<AreaFilterContextType | undefined>(undefined);

export const AreaFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isSuperAdmin, isDistrictAdmin, isMahallaOperator } = useAuth();

  const [selectedDistrictId, setSelectedDistrictIdState] = useState<string>(() => {
    return localStorage.getItem('global_selected_district_id') || '';
  });

  const [selectedMahallaId, setSelectedMahallaIdState] = useState<string>(() => {
    return localStorage.getItem('global_selected_mahalla_id') || '';
  });

  // Rolga qarab boshlang'ich qiymatni belgilash
  useEffect(() => {
    if (isDistrictAdmin && user?.districtId) {
      setSelectedDistrictIdState(user.districtId);
      localStorage.setItem('global_selected_district_id', user.districtId);
    } else if (isMahallaOperator) {
      if (user?.districtId) {
        setSelectedDistrictIdState(user.districtId);
        localStorage.setItem('global_selected_district_id', user.districtId);
      }
      if (user?.mahallaId) {
        setSelectedMahallaIdState(user.mahallaId);
        localStorage.setItem('global_selected_mahalla_id', user.mahallaId);
      }
    }
  }, [user, isDistrictAdmin, isMahallaOperator]);

  const setSelectedDistrictId = (id: string) => {
    setSelectedDistrictIdState(id);
    if (id) {
      localStorage.setItem('global_selected_district_id', id);
    } else {
      localStorage.removeItem('global_selected_district_id');
    }
    // Tumanni o'zgartirganda mahallani tozalash
    setSelectedMahallaIdState('');
    localStorage.removeItem('global_selected_mahalla_id');
  };

  const setSelectedMahallaId = (id: string) => {
    setSelectedMahallaIdState(id);
    if (id) {
      localStorage.setItem('global_selected_mahalla_id', id);
    } else {
      localStorage.removeItem('global_selected_mahalla_id');
    }
  };

  const clearFilters = () => {
    if (isSuperAdmin) {
      setSelectedDistrictIdState('');
      setSelectedMahallaIdState('');
      localStorage.removeItem('global_selected_district_id');
      localStorage.removeItem('global_selected_mahalla_id');
    }
  };

  return (
    <AreaFilterContext.Provider
      value={{
        selectedDistrictId,
        setSelectedDistrictId,
        selectedMahallaId,
        setSelectedMahallaId,
        clearFilters,
      }}
    >
      {children}
    </AreaFilterContext.Provider>
  );
};

export const useAreaFilter = () => {
  const context = useContext(AreaFilterContext);
  if (!context) {
    throw new Error('useAreaFilter must be used within an AreaFilterProvider');
  }
  return context;
};
