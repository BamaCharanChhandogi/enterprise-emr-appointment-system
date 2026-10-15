import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Printer, X } from 'lucide-react';

const PrintSlipModal = ({ open, onOpenChange, appointment }) => {
  if (!appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  const patientName = appointment.patient?.name || appointment.newPatientData?.name || 'Walk-in Patient';
  const patientPhone = appointment.patient?.phone || appointment.newPatientData?.phone || 'N/A';
  const patientId = appointment.patient?.patientId || appointment.patientId || 'MRN-PENDING';
  const doctorName = appointment.doctor?.name || appointment.doctorName || 'Attending Physician';
  const department = appointment.department || 'General Medicine';
  const date = appointment.date;
  const timeSlot = `${appointment.slotStartTime} - ${appointment.slotEndTime}`;
  const appointmentNumber = appointment.appointmentNumber || 'APP-TEMP';
  const purpose = appointment.purpose || 'General Consultation';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in no-print" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-xl w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 z-50 max-h-[92vh] overflow-y-auto">
          
          {/* Header controls (Screen only) */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 no-print">
            <Dialog.Title className="text-[15px] font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <Printer className="w-4 h-4 text-[#2555ff]" />
              <span>Patient Appointment Token Slip</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Printable Thermal/A4 Slip Area */}
          <div
            id="printable-clinical-slip"
            className="bg-white border-2 border-slate-900/90 rounded-xl p-6 text-slate-900 font-sans"
          >
            {/* Hospital Branding */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0f172a] text-white flex items-center justify-center font-bold text-sm">
                  +
                </div>
                <div>
                  <h1 className="text-[15px] font-extrabold uppercase tracking-tight text-slate-900 leading-tight">
                    NexusEMR Clinical Healthcare
                  </h1>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
                    Outpatient Department (OPD) • Clinical Token
                  </span>
                </div>
              </div>

              <div className="text-right font-mono text-[10px] text-slate-500 leading-tight">
                <div>DATE: {new Date().toISOString().split('T')[0]}</div>
                <div>TIME: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>

            {/* Token Highlight Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Appointment Reference
              </span>
              <div className="text-2xl font-black font-mono tracking-tight text-[#0f172a] mt-0.5">
                {appointmentNumber}
              </div>
              <span className="inline-block mt-1 text-[11px] font-semibold text-[#2555ff] uppercase tracking-wide">
                Slot Confirmed • Token Active
              </span>
            </div>

            {/* Structured Clinical Details Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12px] pb-4 border-b border-dashed border-slate-300 mb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Patient Name
                </span>
                <span className="font-bold text-slate-900 text-[13px]">{patientName}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Medical Record # (MRN)
                </span>
                <span className="font-mono font-semibold text-slate-800">{patientId}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Patient Contact
                </span>
                <span className="font-mono text-slate-800">{patientPhone}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Attending Physician
                </span>
                <span className="font-bold text-slate-900">{doctorName}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Clinical Department
                </span>
                <span className="font-medium text-[#2555ff]">{department}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Scheduled Consultation Window
                </span>
                <span className="font-bold text-slate-900 font-mono text-[12px]">
                  {date} ({timeSlot})
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Purpose / Chief Complaint
                </span>
                <span className="text-slate-800 font-medium">{purpose}</span>
              </div>
            </div>

            {/* Patient Instructions */}
            <div className="text-[10px] text-slate-500 space-y-1 mb-4 leading-normal">
              <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Hospital OPD Guidelines:
              </div>
              <p>• Please report to the floor nursing station 10 minutes prior to slot start time.</p>
              <p>• Carry valid government photo identity and prior prescription records.</p>
              <p>• For urgent rescheduling, contact the central reception desk with this token reference.</p>
            </div>

            {/* Validation Stamp Box */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-[10px] text-slate-400">
              <div>
                <span>Generated by NexusEMR Clinical Architecture</span>
              </div>
              <div className="border border-dashed border-slate-300 px-3 py-1 rounded text-center font-mono text-[9px] text-slate-500">
                [ CLINIC DESK STAMP / VERIFIED ]
              </div>
            </div>
          </div>

          {/* Action Footer (Screen only) */}
          <div className="mt-5 flex justify-end space-x-2.5 no-print">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn-secondary text-[12px] py-1.5 px-4"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn-primary text-[12px] py-1.5 px-4 flex items-center space-x-2"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span>Print Slip</span>
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PrintSlipModal;
