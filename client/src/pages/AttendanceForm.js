import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import Loading from '../components/Loading';

const AttendanceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [labourList, setLabourList] = useState([]);
  const [form, setForm] = useState({
    labourId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'daily',
    hoursWorked: 8,
    notes: ''
  });
  const [calcAmount, setCalcAmount] = useState(0);

  useEffect(() => {
    api.get('/labour').then(res => {
      setLabourList(res.data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (id) {
      api.get(`/attendance/${id}`).then(res => {
        const d = res.data.data;
        setForm({
          labourId: d.labourId?._id || d.labourId || '',
          date: d.date ? d.date.substring(0, 10) : '',
          type: d.type || 'daily',
          hoursWorked: d.hoursWorked || 0,
          notes: d.notes || ''
        });
        setCalcAmount(d.amount || 0);
        setLoading(false);
      }).catch(() => { setLoading(false); });
    }
  }, [id]);

  useEffect(() => {
    const labour = labourList.find(l => l._id === form.labourId);
    if (!labour) return;
    if (form.type === 'hourly') {
      setCalcAmount((labour.hourlyRate || 0) * (form.hoursWorked || 0));
    } else {
      setCalcAmount(labour.dailyRate || 0);
    }
  }, [form.labourId, form.type, form.hoursWorked, labourList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.labourId || !form.date) {
      window.alert('Please select labour and date');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/attendance/${id}`, form);
      } else {
        await api.post('/attendance', form);
      }
      navigate('/attendance');
    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const selectedLabour = labourList.find(l => l._id === form.labourId);

  if (loading) return <Loading />;

  return (
    <div className="page-enter">
      <h4 className="fw-bold mb-4">{isEdit ? 'Edit Attendance' : 'Mark Attendance'}</h4>
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small">Labour *</label>
                <select className="form-select" value={form.labourId} onChange={(e) => setForm({...form, labourId: e.target.value})} required>
                  <option value="">Select Labour</option>
                  {labourList.filter(l => l.active !== false).map(l => (
                    <option key={l._id} value={l._id}>
                      {l.name} {l.hourlyRate > 0 ? `(₹${l.hourlyRate}/hr` : ''}{l.dailyRate > 0 ? ` | ₹${l.dailyRate}/day` : ''}{l.hourlyRate > 0 || l.dailyRate > 0 ? ')' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small">Date *</label>
                <input type="date" className="form-control" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required />
              </div>
              <div className="col-md-3">
                <label className="form-label small">Type</label>
                <select className="form-select" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
                  <option value="daily">Daily Wage</option>
                  <option value="hourly">Hourly Wage</option>
                </select>
              </div>
              {form.type === 'hourly' && (
                <div className="col-md-4">
                  <label className="form-label small">Hours Worked</label>
                  <input type="number" className="form-control" value={form.hoursWorked} onChange={(e) => setForm({...form, hoursWorked: parseFloat(e.target.value) || 0})} min={0} step={0.5} />
                </div>
              )}
              <div className="col-md-8">
                <label className="form-label small">Notes</label>
                <input type="text" className="form-control" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
              </div>
            </div>

            {selectedLabour && (
              <div className="mt-3 p-3 bg-light rounded">
                <div className="row g-2 small">
                  <div className="col-auto"><strong>Labour:</strong> {selectedLabour.name}</div>
                  <div className="col-auto"><strong>Rate:</strong> {form.type === 'hourly' ? `₹${selectedLabour.hourlyRate || 0}/hr` : `₹${selectedLabour.dailyRate || 0}/day`}</div>
                  <div className="col-auto"><strong>Amount:</strong> <span className="fw-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(calcAmount)}</span></div>
                </div>
              </div>
            )}

            <div className="mt-4 d-flex gap-2">
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update Attendance' : 'Save Attendance'}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/attendance')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AttendanceForm;
