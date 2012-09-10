/*
 * Copyright 2004-2012 ICEsoft Technologies Canada Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

package org.icefaces.mobi.component.gmap;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.faces.application.Resource;
import javax.faces.application.ResourceHandler;
import javax.faces.application.ResourceHandlerWrapper;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import javax.faces.event.AbortProcessingException;
import javax.faces.event.PreRenderViewEvent;
import javax.faces.event.SystemEvent;
import javax.faces.event.SystemEventListener;

import org.icefaces.impl.util.Base64;
import org.icefaces.impl.util.Util;
import org.icefaces.util.EnvUtils;

public class GMapResourceHandler extends ResourceHandlerWrapper {
	private static final String GMAP_API = "org.icefaces.component.gmap/api.js";
	private static final byte[] NO_BYTES = new byte[0];
	private ResourceHandler handler;
	private String gmapKey;
	private Resource apiJS = null;

	public GMapResourceHandler(ResourceHandler handler) {
		this.handler = handler;
		gmapKey = FacesContext.getCurrentInstance().getExternalContext()
				.getInitParameter("org.mobi.gmapKey");
		FacesContext
				.getCurrentInstance()
				.getApplication()
				.subscribeToEvent(PreRenderViewEvent.class,
						new SystemEventListener() {
							public void processEvent(SystemEvent event)
									throws AbortProcessingException {
								try {
									if (apiJS == null)
										createResource(GMAP_API);
								} catch (Exception e) {
									e.printStackTrace();
								}
							}

							public boolean isListenerForSource(Object source) {
								return EnvUtils.isICEfacesView(FacesContext
										.getCurrentInstance());
							}
						});
	}

	public ResourceHandler getWrapped() {
		return handler;
	}

	public Resource createResource(String resourceName) {
		return createResource(resourceName, null, null);
	}

	public Resource createResource(String resourceName, String libraryName) {
		return createResource(resourceName, libraryName, null);
	}

	public Resource createResource(String resourceName, String libraryName,
			String contentType) {
		if (GMAP_API.equals(resourceName)) {
			if (apiJS == null) {
				if (gmapKey != null) {
					apiJS = recreateResource(
							super.createResource(resourceName),
							"http://maps.googleapis.com/maps/api/js?key="
									+ gmapKey + "&sensor=true");
				} else {
					apiJS = recreateResource(
							super.createResource(resourceName),
							"http://maps.googleapis.com/maps/api/js?&sensor=true");
				}
			}
			return apiJS;
		} else {
			return super.createResource(resourceName, libraryName, contentType);
		}
	}

	private Resource recreateResource(Resource resource, String url) {
		byte[] content;
		try {
			InputStream in = new URL(url).openConnection().getInputStream();
			content = readIntoByteArray(in);
		} catch (IOException e) {
			content = NO_BYTES;
		}
		return new ResourceEntry(GMAP_API, resource.getRequestPath(), content);
	}

	private static byte[] readIntoByteArray(InputStream in) throws IOException {
		byte[] buffer = new byte[4096];
		int bytesRead;
		ByteArrayOutputStream out = new ByteArrayOutputStream();

		while ((bytesRead = in.read(buffer)) != -1) {
			out.write(buffer, 0, bytesRead); // write
		}
		out.flush();

		return out.toByteArray();
	}

	private class ResourceEntry extends Resource {
		private Date lastModified = new Date();
		private String localPath;
		private String requestPath;
		private byte[] content;
		private String mimeType;

		private ResourceEntry(String localPath, String requestPath,
				byte[] content) {
			this.localPath = localPath;
			this.requestPath = requestPath;
			this.content = content;
			FacesContext facesContext = FacesContext.getCurrentInstance();
			ExternalContext externalContext = facesContext.getExternalContext();
			this.mimeType = externalContext.getMimeType(localPath);
		}

		public InputStream getInputStream() throws IOException {
			return new ByteArrayInputStream(content);
		}

		public Map<String, String> getResponseHeaders() {

			HashMap headers = new HashMap();
			headers.put("ETag", eTag());
			headers.put("Cache-Control", "public");
			headers.put("Content-Type", mimeType);
			headers.put("Date", Util.HTTP_DATE.format(new Date()));
			headers.put("Last-Modified", Util.HTTP_DATE.format(lastModified));

			return headers;
		}

		public String getContentType() {
			return mimeType;
		}

		public String getRequestPath() {
			return requestPath;
		}

		public URL getURL() {
			try {
				return FacesContext.getCurrentInstance().getExternalContext()
						.getResource(localPath);
			} catch (MalformedURLException e) {
				throw new RuntimeException(e);
			}
		}

		public boolean userAgentNeedsUpdate(FacesContext context) {
			try {
				Date modifiedSince = Util.HTTP_DATE.parse(context
						.getExternalContext().getRequestHeaderMap()
						.get("If-Modified-Since"));
				return lastModified.getTime() > modifiedSince.getTime() + 1000;
			} catch (Throwable e) {
				return true;
			}
		}

		private String eTag() {
			return Base64.encode(String.valueOf(localPath.hashCode()));
		}
	}

}
