import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CModal, CModalHeader, CModalTitle, CModalBody } from '@coreui/react';

type Props = {
  active: boolean;
  src: string | null;
  handleDismiss: () => void;
  title?: string;
}

const DemoPreview: React.FC<Props> = ({ active = false, src, handleDismiss, title }: Props) => {
  const { t } = useTranslation();
  const [fileContent, setFileContent] = useState<string>('');

  useEffect(() => {
    if (active && src) {
      fetch(src)
        .then(response => response.text())
        .then(text => {
          setFileContent(text);
        })
        .catch(err => console.error("Failed to load file", err));
    }
  }, [src, active]);

  return (
    <CModal visible={active} alignment="center" size="xl" onDismiss={handleDismiss}>
      <CModalHeader>
        <CModalTitle>{title || t('demos.preview.title')}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'scroll' }}>
          {fileContent || 'No content available'}
        </pre>
      </CModalBody>
    </CModal>
  );
}

export default DemoPreview;
