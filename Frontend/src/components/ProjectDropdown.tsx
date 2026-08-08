import React from 'react';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, CheckCircleIcon, PauseCircleIcon } from '@heroicons/react/24/outline';
import { Layers } from 'lucide-react';

interface Project {
  id: string;
  inquiryCode?: string;
  client: string;
  project: string;
  holdStatus?: boolean;
}

interface ProjectDropdownProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
}

export default function ProjectDropdown({ projects, selectedProjectId, onSelectProject }: ProjectDropdownProps) {
  const selectedProject = selectedProjectId === 'ALL' 
    ? null 
    : (projects.find(p => p.id === selectedProjectId || p.inquiryCode === selectedProjectId) || projects[0]);

  if (!projects || projects.length === 0) {

    return (
      <div className="text-sm font-medium text-slate-500 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
        No active projects
      </div>
    );
  }

  return (
    <Menu as="div" className="relative inline-block text-left w-full sm:w-auto">
      <div>
        <Menu.Button className="inline-flex w-full justify-between items-center gap-x-3 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 min-w-[280px]">
          <div className="flex flex-col items-start text-left truncate">
            <span className="text-xs text-slate-500 font-medium mb-0.5 uppercase tracking-wider">
              {selectedProjectId === 'ALL' ? 'PORTFOLIO' : (selectedProject?.inquiryCode || selectedProject?.id || 'Project')}
            </span>
            <span className="truncate max-w-[220px]">
              {selectedProjectId === 'ALL' ? 'All Projects' : `${selectedProject?.client} - ${selectedProject?.project}`}
            </span>
          </div>
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-slate-400 shrink-0" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-full origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-96 overflow-y-auto">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 mb-1">
              Active Manufacturing Jobs
            </div>
            <Menu.Item key="ALL">
              {({ active }) => (
                <button
                  onClick={() => onSelectProject('ALL')}
                  className={`
                    w-full text-left px-4 py-3 text-sm flex flex-col gap-1 transition-colors border-b border-slate-50
                    ${active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'}
                    ${selectedProjectId === 'ALL' ? 'bg-blue-50/50' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 flex items-center gap-2">
                      All Projects
                      <Layers className="h-4 w-4 text-blue-500" />
                    </span>
                    {selectedProjectId === 'ALL' && <span className="text-blue-600 text-xs font-medium">Selected</span>}
                  </div>
                  <span className="text-slate-500 text-xs line-clamp-1">
                    Aggregated View
                  </span>
                </button>
              )}
            </Menu.Item>
            {projects.map((project) => (
              <Menu.Item key={project.id}>
                {({ active }) => {
                  const isSelected = selectedProjectId === project.id || selectedProjectId === project.inquiryCode;
                  return (
                    <button
                      onClick={() => onSelectProject(project.inquiryCode || project.id)}
                      className={`
                        w-full text-left px-4 py-3 text-sm flex flex-col gap-1 transition-colors
                        ${active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'}
                        ${isSelected ? 'bg-blue-50/50' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 flex items-center gap-2">
                          {project.inquiryCode}
                          {project.holdStatus ? (
                            <PauseCircleIcon className="h-4 w-4 text-amber-500" title="On Hold" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4 text-emerald-500" title="Active" />
                          )}
                        </span>
                        {isSelected && <span className="text-blue-600 text-xs font-medium">Selected</span>}
                      </div>
                      <span className="text-slate-500 text-xs line-clamp-1">
                        {project.client} - {project.project}
                      </span>
                    </button>
                  );
                }}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
