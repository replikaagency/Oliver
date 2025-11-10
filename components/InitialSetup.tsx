
import React from 'react';
import type { UserLevel, Topic } from '../types';
import { UserLevel as UserLevelEnum, Topic as TopicEnum } from '../types';

interface InitialSetupProps {
  userLevel: UserLevel | null;
  onSetLevel: (level: UserLevel) => void;
  onSetTopic: (topic: Topic) => void;
}

const Card: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-8 w-full max-w-2xl mx-auto">
        {children}
    </div>
);

const Title: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <h2 className="text-2xl font-bold text-center text-cyan-400 mb-6">{children}</h2>
);

const Button: React.FC<{onClick: () => void, children: React.ReactNode}> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
    >
        {children}
    </button>
);


const InitialSetup: React.FC<InitialSetupProps> = ({ userLevel, onSetLevel, onSetTopic }) => {
  return (
    <div className="flex items-center justify-center h-full p-4 bg-gray-900">
      {!userLevel ? (
        <Card>
          <Title>Bienvenido. ¿Cuál es tu nivel?</Title>
          <div className="space-y-4">
            <Button onClick={() => onSetLevel(UserLevelEnum.Basico)}>Básico</Button>
            <Button onClick={() => onSetLevel(UserLevelEnum.Intermedio)}>Intermedio</Button>
            <Button onClick={() => onSetLevel(UserLevelEnum.Avanzado)}>Avanzado</Button>
          </div>
        </Card>
      ) : (
        <Card>
          <Title>¿Qué tema quieres practicar?</Title>
          <div className="space-y-4">
            <Button onClick={() => onSetTopic(TopicEnum.PlanosAcotados)}>Sistema de Planos Acotados</Button>
            <Button onClick={() => onSetTopic(TopicEnum.Diedrico)}>Sistema Diédrico</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default InitialSetup;
