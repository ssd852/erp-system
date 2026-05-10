import { useCallback, useEffect, useState } from 'react';
import { Inbox, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { supabase } from '../config/supabaseClient';

const getNestedValue = (row, path) => {
  if (!path) return undefined;
  return String(path)
    .split('.')
    .reduce((value, key) => (value == null ? value : value[key]), row);
};

const getStatusTone = (value) => {
  const text = String(value ?? '').toLowerCase();

  if (/paid|active|مدفوع|نشط/.test(text)) {
    return 'bg-green-100 text-green-800 ring-green-200 dark:bg-green-500/10 dark:text-green-300 dark:ring-green-400/20';
  }

  if (/pending|قيد الانتظار|قيد|انتظار|معلق/.test(text)) {
    return 'bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20';
  }

  if (/unpaid|rejected|مرفوض|غير مدفوع|متأخر/.test(text)) {
    return 'bg-red-100 text-red-800 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/20';
  }

  return '';
};

const shouldRenderBadge = (column, value) => {
  const key = String(column?.field || column?.key || '').toLowerCase();
  return Boolean(getStatusTone(value) || key.includes('status') || key.includes('state') || key.includes('الحالة'));
};

const formatCellValue = (value) => {
  if (value == null || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};

const DynamicCrudTable = ({
  columns = [],
  rows,
  data,
  loading: externalLoading = false,
  tableName,
  primaryKey = 'id',
  selectQuery = '*',
  orderBy = 'id',
  orderAscending = true,
  onEdit,
  onDelete,
  onDataChange,
  onCrudReady,
  emptyMessage = 'لا توجد بيانات لعرضها',
  getRowId = (row) => row.id,
}) => {
  const { showToast } = useToast();
  const [internalRows, setInternalRows] = useState([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const normalizedTableName = tableName ? tableName.toLowerCase() : '';
  const usesExternalRows = rows !== undefined || data !== undefined;
  const tableRows = rows || data || internalRows;
  const loading = externalLoading || internalLoading;

  const fetchData = useCallback(async () => {
    if (!normalizedTableName || usesExternalRows) return;

    try {
      setInternalLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('يرجى تسجيل الدخول أولاً');

      const { data: fetchedRows, error } = await supabase
        .from(normalizedTableName)
        .select(selectQuery)
        .eq('user_id', user.id)
        .order(orderBy, { ascending: orderAscending });

      if (error) throw error;

      setInternalRows(fetchedRows || []);
      onDataChange?.(fetchedRows || []);
    } catch (error) {
      console.error('Supabase Error:', error);
      showToast('error', 'خطأ', error.message || 'فشل جلب البيانات');
    } finally {
      setInternalLoading(false);
    }
  }, [normalizedTableName, onDataChange, orderAscending, orderBy, selectQuery, showToast, usesExternalRows]);

  const saveItem = useCallback(
    async (item) => {
      if (!normalizedTableName) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('يرجى تسجيل الدخول أولاً');

        const isEdit = item?.[primaryKey] !== undefined && item?.[primaryKey] !== null;
        // Inject user_id implicitly on every save
        const payload = { ...(item || {}), user_id: user.id };

        if (isEdit) {
          const { error } = await supabase
            .from(normalizedTableName)
            .update(payload)
            .eq(primaryKey, item[primaryKey])
            .eq('user_id', user.id);

          if (error) throw error;
          showToast('success', 'نجاح', 'تم تحديث البيانات');
        } else {
          const { error } = await supabase.from(normalizedTableName).insert([payload]);

          if (error) throw error;
          showToast('success', 'نجاح', 'تم إضافة البيانات');
        }

        await fetchData();
      } catch (error) {
        console.error('Supabase Error:', error);
        showToast('error', 'خطأ', error.message || 'فشل في حفظ البيانات');
      }
    },
    [fetchData, normalizedTableName, primaryKey, showToast]
  );

  const deleteItem = useCallback(
    async (item) => {
      if (!normalizedTableName) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('يرجى تسجيل الدخول أولاً');

        const rowId = item?.[primaryKey];
        const { error } = await supabase
          .from(normalizedTableName)
          .delete()
          .eq(primaryKey, rowId)
          .eq('user_id', user.id);

        if (error) throw error;

        showToast('success', 'نجاح', 'تم حذف البيانات بنجاح');
        await fetchData();
      } catch (error) {
        console.error('Supabase Error:', error);
        showToast('error', 'خطأ', error.message || 'فشل عملية الحذف');
      }
    },
    [fetchData, normalizedTableName, primaryKey, showToast]
  );

  useEffect(() => {
    const id = setTimeout(() => {
      fetchData();
    }, 0);

    return () => clearTimeout(id);
  }, [fetchData]);

  useEffect(() => {
    onCrudReady?.({ fetchData, saveItem, deleteItem });
  }, [deleteItem, fetchData, onCrudReady, saveItem]);

  const handleDelete = onDelete || (normalizedTableName ? deleteItem : undefined);
  const visibleColumns =
    columns.length > 0
      ? columns
      : Object.keys(tableRows[0] || {}).map((key) => ({
          field: key,
          header: key,
        }));
  const actionColSpan = onEdit || handleDelete ? 1 : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/40">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-right dark:divide-white/10">
          <thead className="sticky top-0 z-10 bg-white/80 backdrop-blur-md dark:bg-slate-950/80">
            <tr>
              {visibleColumns.map((column) => (
                <th
                  key={column.field || column.key || column.header}
                  scope="col"
                  className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400"
                >
                  {column.header || column.label || column.field}
                </th>
              ))}
              {(onEdit || handleDelete) && (
                <th className="whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  الإجراءات
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white dark:divide-white/10 dark:bg-transparent">
            {loading &&
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {visibleColumns.map((column) => (
                    <td key={`${column.field || column.key}-${rowIndex}`} className="px-5 py-4">
                      <div className="h-4 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                    </td>
                  ))}
                  {(onEdit || handleDelete) && (
                    <td className="px-5 py-4">
                      <div className="h-8 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-white/10" />
                    </td>
                  )}
                </tr>
              ))}

            {!loading &&
              tableRows.map((row, rowIndex) => (
                <tr
                  key={getRowId(row) ?? rowIndex}
                  className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/[0.04]"
                >
                  {visibleColumns.map((column) => {
                    const value = column.render
                      ? column.render(row)
                      : getNestedValue(row, column.field || column.key);
                    const badgeClass = shouldRenderBadge(column, value) ? getStatusTone(value) : '';

                    return (
                      <td
                        key={column.field || column.key || column.header}
                        className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900 dark:text-slate-100"
                      >
                        {badgeClass ? (
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badgeClass}`}>
                            {formatCellValue(value)}
                          </span>
                        ) : (
                          <span className="text-gray-700 dark:text-slate-300">{formatCellValue(value)}</span>
                        )}
                      </td>
                    );
                  })}

                  {(onEdit || handleDelete) && (
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-1">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(row)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                            aria-label="Edit row"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        {handleDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(row)}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                            aria-label="Delete row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}

            {!loading && tableRows.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length + actionColSpan} className="px-5 py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-500">
                      <Inbox className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{emptyMessage}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">
                      ستظهر السجلات هنا بمجرد إضافتها إلى النظام.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DynamicCrudTable;
