// src/admin-portal/pages/members/MemberCreateModal.jsx
// POST /users is SUPER_ADMIN-only for every role, including STUDENT (see
// backend/src/modules/users/users.routes.ts) - not LIBRARIAN+ like the rest
// of Members. The response's tempPassword is generated once and never
// stored or logged server-side (users.service.ts), so this is the only
// place it will ever be visible - shown until explicitly dismissed, not a
// toast that vanishes in 5 seconds.
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { membersService } from '../../services/membersService';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { useToast } from '../../components/common/Toast';
import { focusFirstError } from '../../utils/focusFirstError';

const EMPTY = { name: '', email: '', student_id: '', department: '', year_of_study: '' };

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Name is required.';
  if (!values.email.trim()) errors.email = 'Email is required.';
  else if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.email = 'Enter a valid email address.';
  return errors;
}

export function MemberCreateModal({ open, onClose }) {
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [created, setCreated] = useState(null); // { user, tempPassword }
  const queryClient = useQueryClient();
  const toast = useToast();
  const errors = validate(values);

  const mutation = useMutation({
    mutationFn: () =>
      membersService.create({
        name: values.name.trim(),
        email: values.email.trim(),
        student_id: values.student_id.trim() || undefined,
        department: values.department.trim() || undefined,
        year_of_study: values.year_of_study ? Number(values.year_of_study) : undefined,
      }),
    onSuccess: (envelope) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreated(envelope.data);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not create this member.')),
  });

  function handleChange(field) {
    return (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));
  }
  function handleBlur(field) {
    return () => setTouched((prev) => ({ ...prev, [field]: true }));
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
      <Modal open={open} onClose={handleClose} title="Member created" size="sm" footer={<Button onClick={handleClose}>Done</Button>}>
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
      title="Add member"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={mutation.isPending}>
            Create member
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="form-grid-2">
        <FormField label="Name" required error={errors.name} touched={touched.name}>
          {(props) => <input {...props} type="text" value={values.name} onChange={handleChange('name')} onBlur={handleBlur('name')} />}
        </FormField>
        <FormField label="Email" required error={errors.email} touched={touched.email}>
          {(props) => <input {...props} type="email" value={values.email} onChange={handleChange('email')} onBlur={handleBlur('email')} />}
        </FormField>
        <FormField label="Student ID">
          {(props) => <input {...props} type="text" value={values.student_id} onChange={handleChange('student_id')} />}
        </FormField>
        <FormField label="Department">
          {(props) => <input {...props} type="text" value={values.department} onChange={handleChange('department')} />}
        </FormField>
        <FormField label="Year of study">
          {(props) => (
            <input {...props} type="number" min={1} max={10} value={values.year_of_study} onChange={handleChange('year_of_study')} />
          )}
        </FormField>
      </form>
    </Modal>
  );
}
