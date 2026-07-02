import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const CompanyContext = createContext();

export const useCompany = () => useContext(CompanyContext);

export const CompanyProvider = ({ children }) => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const res = await api.get('/company');
      setCompany(res.data.data);
    } catch (err) {
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (data) => {
    if (company?._id) {
      const res = await api.put(`/company/${company._id}`, data);
      setCompany(res.data.data);
      return res.data.data;
    }
    return null;
  };

  const createCompany = async (data) => {
    const res = await api.post('/company', data);
    setCompany(res.data.data);
    return res.data.data;
  };

  return (
    <CompanyContext.Provider value={{ company, loading, fetchCompany, updateCompany, createCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export default CompanyContext;
