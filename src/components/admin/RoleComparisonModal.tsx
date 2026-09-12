import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { RoleDefinition } from '../../types/erp';
import { erpModulesList } from '../../data/rbacData';
import { Check, X, Shield, ArrowRightLeft } from 'lucide-react';

interface RoleComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: RoleDefinition[];
}

export const RoleComparisonModal: React.FC<RoleComparisonModalProps> = ({
  isOpen,
  onClose,
  roles,
}) => {
  const [roleAId, setRoleAId] = useState<string>(roles[0]?.id || '');
  const [roleBId, setRoleBId] = useState<string>(roles[1]?.id || roles[0]?.id || '');
  const [showDiffOnly, setShowDiffOnly] = useState(false);

  const roleA = roles.find((r) => r.id === roleAId) || roles[0];
  const roleB = roles.find((r) => r.id === roleBId) || roles[1] || roles[0];

  const actions = ['view', 'create', 'edit', 'delete', 'export', 'approve'] as const;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Role Permission Comparison Tool"
      subtitle="Compare granular authorization differences between two institutional personas"
      maxWidth="4xl"
      footer={
        <div className="flex justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Role selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Primary Role (A)
            </label>
            <select
              value={roleAId}
              onChange={(e) => setRoleAId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{roleA?.description}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Comparison Role (B)
            </label>
            <select
              value={roleBId}
              onChange={(e) => setRoleBId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{roleB?.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showDiffOnly}
              onChange={(e) => setShowDiffOnly(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600"
            />
            <span>Highlight differences only</span>
          </label>
          <span className="text-[11px] text-slate-400">
            Comparing <span className="font-bold text-indigo-600">{roleA?.name}</span> vs{' '}
            <span className="font-bold text-purple-600">{roleB?.name}</span>
          </span>
        </div>

        {/* Modules table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">ERP Module</th>
                <th className="py-2.5 px-2 text-center bg-indigo-50/50 dark:bg-indigo-950/20">{roleA?.name}</th>
                <th className="py-2.5 px-2 text-center bg-purple-50/50 dark:bg-purple-950/20">{roleB?.name}</th>
                <th className="py-2.5 px-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {erpModulesList
                .filter((mod) => {
                  if (!showDiffOnly) return true;
                  const aPerm = roleA?.permissions[mod.id];
                  const bPerm = roleB?.permissions[mod.id];
                  return actions.some((act) => aPerm?.[act] !== bPerm?.[act]);
                })
                .map((mod) => {
                  const aPerm = roleA?.permissions[mod.id];
                  const bPerm = roleB?.permissions[mod.id];
                  const hasDiff = actions.some((act) => aPerm?.[act] !== bPerm?.[act]);

                  return (
                    <tr
                      key={mod.id}
                      className={hasDiff ? 'bg-amber-50/30 dark:bg-amber-950/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}
                    >
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900 dark:text-white">{mod.name}</p>
                        <span className="text-[10px] text-slate-400">{mod.category}</span>
                      </td>

                      <td className="py-2.5 px-2 text-center bg-indigo-50/20 dark:bg-indigo-950/10">
                        <div className="flex justify-center gap-1">
                          {actions.map((act) => (
                            <span
                              key={act}
                              title={`${act}: ${aPerm?.[act] ? 'Allowed' : 'Denied'}`}
                              className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${
                                aPerm?.[act]
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                              }`}
                            >
                              {act[0].toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center bg-purple-50/20 dark:bg-purple-950/10">
                        <div className="flex justify-center gap-1">
                          {actions.map((act) => (
                            <span
                              key={act}
                              title={`${act}: ${bPerm?.[act] ? 'Allowed' : 'Denied'}`}
                              className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${
                                bPerm?.[act]
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                              }`}
                            >
                              {act[0].toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-2.5 px-2 text-center">
                        {hasDiff ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            Differs
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                            Identical
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};
