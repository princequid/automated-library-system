// src/admin-portal/pages/staff/StaffCreateModal.jsx
// This whole page is already ADMINISTRATOR-only (see constants/nav.js), which
// matches POST /users's actual gate exactly - no extra rank check needed
// here the way MemberCreateModal needs one on a page LIBRARIAN+ can open.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { staffService, STAFF_ROLES } from '../../services/staffService';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { Select } from '../../components/common/Select';
import { useToast } from '../../components/common/Toast';
import { focusFirstError } from '../../utils/focusFirstError';

const ROLE_OPTIONS = STAFF_ROLES.map((r) => ({ value: r, label: r.charAt(0) + r.slice(1).toLowerCase() }));
const EMPTY = { name: '', email: '', role: 'LIBRARIAN', department: '' };

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Name is required.';
  if (!values.email.trim()) errors.email = 'Email is required.';
  else if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = 'Enter a valid email address.';
  return errors;
}

export function StaffCreateModal({ open, onClose }) {
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [created, setCreated] = useState(null);
  const queryClient = useQueryClient();
  const toast = useToast();
  const errors = validate(values);

  const mutation = useMutation({
    mutationFn: () =>
      staffService.create({
        name: values.name.trim(),
        email: values.email.trim(),
        role: values.role,
        department: values.department.trim() || undefined,
      }),
    onSuccess: (envelope) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreated(envelope.data);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not create this account.')),
  });

  function handleChange(field) {
    return (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));
  }
  function handleSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, email: true });
    if (Object.keys(errors).length > 0) {
      focusFirstError(e.currentTarget);
      return;
    }
    mutation.mutate();
  }
  function handleClose() {
    setValues(EMPTY);
    setTouched({});
    setCreated(null);
    onClose();
  }

  if (created) {
    return (
      <Modal open={open} onClose={handleClose} title="Staff account created" size="sm" footer={<Button onClick={handleClose}>Done</Button>}>
        <p className="member-created-note">
          Share this temporary password with <strong>{created.user.name}</strong> securely - it will not be shown again.
        </p>
        <p className="member-created-password">{created.tempPassword}</p>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add staff account"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>
            Create account
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="form-grid-2">
        <FormField label="Name" required error={errors.name} touched={touched.name}>
          {(props) => <input {...props} type="text" value={values.name} onChange={handleChange('name')} onBlur={() => setTouched((t) => ({ ...t, name: true }))} />}
        </FormField>
        <FormField label="Email" required error={errors.email} touched={touched.email}>
          {(props) => <input {...props} type="email" value={values.email} onChange={handleChange('email')} onBlur={() => setTouched((t) => ({ ...t, email: true }))} />}
        </FormField>
        <FormField label="Role" required>
          {(props) => <Select {...props} options={ROLE_OPTIONS} value={values.role} onChange={handleChange('role')} />}
        </FormField>
        <FormField label="Department">
          {(props) => <input {...props} type="text" value={values.department} onChange={handleChange('department')} />}
        </FormField>
      </form>
    </Modal>
  );
}
