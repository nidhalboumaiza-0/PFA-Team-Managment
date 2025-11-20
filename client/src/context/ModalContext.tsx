import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
} from "react";
import ConfirmationModal, {
  ModalType,
} from "../components/UI/ConfirmationModal";

interface ModalContextType {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
}

interface ModalOptions {
  title: string;
  message: string;
  type: ModalType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalProviderProps {
  children: ReactNode;
}

const ModalContext = createContext<ModalContextType | undefined>(
  undefined
);

export const ModalProvider: React.FC<ModalProviderProps> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<ModalOptions>({
    title: "",
    message: "",
    type: "confirm",
  });

  const showModal = (options: ModalOptions) => {
    setModalOptions(options);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
  };

  const handleConfirm = () => {
    if (modalOptions.onConfirm) {
      modalOptions.onConfirm();
    }
    hideModal();
  };

  const handleCancel = () => {
    if (modalOptions.onCancel) {
      modalOptions.onCancel();
    }
    hideModal();
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      <ConfirmationModal
        isOpen={isOpen}
        title={modalOptions.title}
        message={modalOptions.message}
        type={modalOptions.type}
        confirmText={modalOptions.confirmText}
        cancelText={modalOptions.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

export default ModalContext;
