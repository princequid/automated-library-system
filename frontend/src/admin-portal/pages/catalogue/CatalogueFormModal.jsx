// src/admin-portal/pages/catalogue/CatalogueFormModal.jsx
// Create or edit a catalog item. Field set matches
// backend/src/modules/catalog/dto/catalog.dto.ts's create/update schemas
// exactly - only title and author are required there.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { catalogService } from '../../services/catalogService';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { Button } from '../../components/common/Button';
import { useToast } from '../../components/common/Toast';
import { focusFirstError } from '../../utils/focusFirstError';

const EMPTY = { title: '', author: '', isbn: '', publisher: '', year: '', shelf_location: '', subject_tags: '', abstract: '' };

function toFormState(item) {
  if (!item) return EMPTY;
  return {
    title: item.title ?? '',
    author: item.author ?? '',
    isbn: item.isbn ?? '',
    publisher: item.publisher ?? '',
    year: item.year ?? '',
    shelf_location: item.shelf_location ?? '',
    subject_tags: (item.subject_tags ?? []).join(', '),
    abstract: item.abstract ?? '',
  };
}

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Title is required.';
  if (!values.author.trim()) errors.author = 'Author is required.';
  if (values.year && (Number(values.year) < 1000 || Number(values.year) > new Date().getFullYear() + 1)) {
    errors.year = 'Enter a plausible publication year.';
  }
  return errors;
}

export function CatalogueFormModal({ open, onClose, item, onManageCopies }) {
  const isEdit = !!item;
  const [values, setValues] = useState(() => toFormState(item));
  const [touched, setTouched] = useState({});
  const queryClient = useQueryClient();
  const toast = useToast();

  const errors = validate(values);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: values.title.trim(),
        author: values.author.trim(),
        isbn: values.isbn.trim() || undefined,
        publisher: values.publisher.trim() || undefined,
        year: values.year ? Number(values.year) : undefined,
        shelf_location: values.shelf_location.trim() || undefined,
        subject_tags: values.subject_tags
          ? values.subject_tags.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        abstract: values.abstract.trim() || undefined,
      };
      return isEdit ? catalogService.update(item.id, payload) : catalogService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'items'] });
      toast.success(isEdit ? 'Item updated.' : 'Item added to the catalogue.');
      onClose();
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not save this item.')),
  });

  function handleChange(field) {
    return (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));
  }
  function handleBlur(field) {
    return () => setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const allTouched = Object.fromEntries(Object.keys(values).map((k) => [k, true]));
    setTouched(allTouched);
    if (Object.keys(errors).length > 0) {
      focusFirstError(e.currentTarget);
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit catalogue item' : 'Add catalogue item'}
      size="lg"
      footer={
        <>
          {isEdit && (
            <Button variant="outline" onClick={() => onManageCopies(item)} disabled={mutation.isPending} className="modal-footer-lead">
              Manage copies
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>
            {isEdit ? 'Save changes' : 'Add item'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="form-grid-2">
        <FormField label="Title" required error={errors.title} touched={touched.title}>
          {(props) => <input {...props} type="text" value={values.title} onChange={handleChange('title')} onBlur={handleBlur('title')} />}
        </FormField>
        <FormField label="Author" required error={errors.author} touched={touched.author}>
          {(props) => <input {...props} type="text" value={values.author} onChange={handleChange('author')} onBlur={handleBlur('author')} />}
        </FormField>
        <FormField label="ISBN" hint="Optional; used for duplicate detection.">
          {(props) => <input {...props} type="text" value={values.isbn} onChange={handleChange('isbn')} />}
        </FormField>
        <FormField label="Publisher">
          {(props) => <input {...props} type="text" value={values.publisher} onChange={handleChange('publisher')} />}
        </FormField>
        <FormField label="Year" error={errors.year} touched={touched.year}>
          {(props) => <input {...props} type="number" value={values.year} onChange={handleChange('year')} onBlur={handleBlur('year')} />}
        </FormField>
        <FormField label="Shelf location">
          {(props) => <input {...props} type="text" value={values.shelf_location} onChange={handleChange('shelf_location')} />}
        </FormField>
        <FormField label="Subject tags" hint="Comma-separated." className="form-field-span-2">
          {(props) => <input {...props} type="text" value={values.subject_tags} onChange={handleChange('subject_tags')} />}
        </FormField>
        <FormField label="Abstract" className="form-field-span-2">
          {(props) => <textarea {...props} rows={3} value={values.abstract} onChange={handleChange('abstract')} />}
        </FormField>
      </form>
    </Modal>
  );
}
