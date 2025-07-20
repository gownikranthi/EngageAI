import React, { useState } from 'react';
import { Resource, eventService } from '../../services/events';
import { FileText, Trash, Plus } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface AdminResourceManagerProps {
  resources: Resource[];
  eventId: string;
  onResourcesUpdate: (resources: Resource[]) => void;
}

export const AdminResourceManager: React.FC<AdminResourceManagerProps> = ({ resources, eventId, onResourcesUpdate }) => {
  const { toast } = useToast();
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !fileUrl.trim()) {
      toast({ title: 'Validation Error', description: 'File name and URL are required.', variant: 'destructive' });
      return;
    }
    setIsAdding(true);
    try {
      const newResource = { fileName, fileUrl, description };
      const updated = await eventService.addResource(eventId, newResource);
      onResourcesUpdate(updated.resources);
      setFileName('');
      setFileUrl('');
      setDescription('');
      toast({ title: 'Resource added', description: 'Resource added successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add resource.', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
      const updated = await eventService.deleteResource(eventId, resourceId);
      onResourcesUpdate(updated.resources);
      toast({ title: 'Resource deleted', description: 'Resource deleted successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete resource.', variant: 'destructive' });
    }
  };

  return (
    <div className="card-primary p-6 mt-8">
      <h3 className="text-subtitle text-foreground mb-4">Manage Resources</h3>
      <form onSubmit={handleAddResource} className="flex flex-col md:flex-row gap-2 mb-6">
        <input
          type="text"
          placeholder="File Name"
          value={fileName}
          onChange={e => setFileName(e.target.value)}
          className="input-primary flex-1"
          required
        />
        <input
          type="url"
          placeholder="File URL"
          value={fileUrl}
          onChange={e => setFileUrl(e.target.value)}
          className="input-primary flex-1"
          required
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="input-primary flex-1"
        />
        <button type="submit" className="btn-primary flex items-center gap-1" disabled={isAdding}>
          <Plus size={16} /> Add
        </button>
      </form>
      <div className="space-y-3">
        {resources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto mb-2" size={32} />
            <p>No resources yet.</p>
          </div>
        ) : (
          resources.map(resource => (
            <div key={resource._id || resource.id} className="p-4 bg-card-subtle rounded-lg border flex items-center justify-between">
              <div>
                <h4 className="text-body font-medium text-foreground truncate">{resource.fileName}</h4>
                {resource.description && <p className="text-caption text-muted-foreground mt-1">{resource.description}</p>}
              </div>
              <button onClick={() => handleDeleteResource(resource._id || resource.id)} className="btn-destructive px-3 py-2 flex items-center gap-1">
                <Trash size={16} /> Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 