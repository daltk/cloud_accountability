class Upload < ActiveRecord::Base
  attr_accessible :upload
  has_attached_file :upload,
                    :storage => :s3,
                    :s3_credentials=>{:access_key_id=>"AKIAIEYL4Y45GWF7H76Q",
                    :secret_access_key => "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"},
                    :s3_permissions => "public-read",
                    :path => ":id",
                    :bucket => "RTReports"

  include Rails.application.routes.url_helpers

  def to_jq_upload
    {
      "name" => read_attribute(:upload_file_name),
      "size" => read_attribute(:upload_file_size),
      "url" => upload.url(:original),
      "delete_url" => upload_path(self),
      "delete_type" => "DELETE" 
    }
  end

end
