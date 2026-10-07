/**
 * Status and Urgency Badge Components
 */

import React from 'react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || 'pending').toLowerCase();
  const label = normalized.replace('_', ' ');

  return (
    <span className={`badge badge-${normalized}`}>
      {label}
    </span>
  );
};

export const UrgencyBadge = ({ urgency }) => {
  const normalized = (urgency || 'medium').toLowerCase();

  return (
    <span className={`badge urgency-${normalized}`}>
      ⚡ {urgency}
    </span>
  );
};
